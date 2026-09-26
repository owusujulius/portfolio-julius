import { supabase } from './supabase';
import { getPublicAssetUrl } from './storage';

export interface Experience {
  id?: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Education {
  id?: string;
  school: string;
  degree: string;
  period: string;
}

export interface ProfileData {
  id: string;
  user_id: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl: string;
  logoPath: string;
  logoUrl: string;
  avatarPath: string;
  resumeUrl: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    instagram: string;
    whatsapp: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  achievements: string[];
}

const emptyProfile: Omit<ProfileData, 'id' | 'user_id'> = {
  name: '',
  role: '',
  bio: '',
  email: '',
  phone: '',
  location: '',
  avatarUrl: '',
  logoPath: '',
  logoUrl: '',
  avatarPath: '',
  resumeUrl: '',
  socials: {
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    whatsapp: '',
  },
  experience: [],
  education: [],
  skills: [],
  achievements: [],
};

function mapProfile(row: any): ProfileData {
  return {
    ...emptyProfile,
    id: row.id,
    user_id: row.user_id,
    name: row.name || '',
    role: row.role || '',
    bio: row.bio || '',
    email: row.email || '',
    phone: row.phone || '',
    location: row.location || '',
    avatarPath: row.avatar_path || '',
    logoPath: row.logo_path || '',
    avatarUrl: getPublicAssetUrl(row.avatar_path),
    logoUrl: getPublicAssetUrl(row.logo_path),
    resumeUrl: row.resume_url || '',
  };
}

export async function getProfile(): Promise<ProfileData | null> {
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileRow) return null;

  const [linksResult, experienceResult, educationResult, skillsResult, achievementsResult] = await Promise.all([
    supabase.from('profile_links').select('platform,url').eq('profile_id', profileRow.id).order('sort_order'),
    supabase.from('experience').select('*').eq('profile_id', profileRow.id).order('sort_order'),
    supabase.from('education').select('*').eq('profile_id', profileRow.id).order('sort_order'),
    supabase.from('skills').select('*').eq('profile_id', profileRow.id).order('sort_order'),
    supabase.from('achievements').select('*').eq('profile_id', profileRow.id).order('sort_order'),
  ]);

  const firstError = linksResult.error || experienceResult.error || educationResult.error || skillsResult.error || achievementsResult.error;
  if (firstError) throw firstError;

  const socials = { ...emptyProfile.socials };
  for (const link of linksResult.data || []) {
    if (link.platform in socials) {
      socials[link.platform as keyof typeof socials] = link.url;
    }
  }

  return {
    ...mapProfile(profileRow),
    socials,
    experience: experienceResult.data || [],
    education: educationResult.data || [],
    skills: (skillsResult.data || []).map((skill) => skill.name),
    achievements: (achievementsResult.data || []).map((achievement) => achievement.value),
  };
}

export function createEmptyProfile(userId: string): ProfileData {
  return { ...emptyProfile, id: '', user_id: userId, socials: { ...emptyProfile.socials }, experience: [], education: [], skills: [], achievements: [] };
}

export async function saveProfile(profile: ProfileData): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error('You must be signed in to save your profile.');

  const profileRow = {
    user_id: authData.user.id,
    name: profile.name.trim(),
    role: profile.role.trim(),
    bio: profile.bio.trim(),
    email: profile.email.trim() || null,
    phone: profile.phone.trim() || null,
    location: profile.location.trim() || null,
    avatar_path: profile.avatarPath || profile.avatarUrl || null,
    logo_path: profile.logoPath || profile.logoUrl || null,
    resume_url: profile.resumeUrl.trim() || null,
  };

  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  let profileId = existing?.id as string | undefined;
  if (profileId) {
    const { error } = await supabase.from('profiles').update(profileRow).eq('id', profileId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('profiles').insert(profileRow).select('id').single();
    if (error) throw error;
    profileId = data.id;
  }

  const [linksError, experienceError, educationError, skillsError, achievementsError] = await Promise.all([
    supabase.from('profile_links').delete().eq('profile_id', profileId),
    supabase.from('experience').delete().eq('profile_id', profileId),
    supabase.from('education').delete().eq('profile_id', profileId),
    supabase.from('skills').delete().eq('profile_id', profileId),
    supabase.from('achievements').delete().eq('profile_id', profileId),
  ]);
  const deleteError = linksError.error || experienceError.error || educationError.error || skillsError.error || achievementsError.error;
  if (deleteError) throw deleteError;

  const linkRows = Object.entries(profile.socials)
    .filter(([, url]) => url.trim())
    .map(([platform, url], index) => ({ profile_id: profileId, platform, url: url.trim(), sort_order: index }));
  const experienceRows = profile.experience.map((item, index) => ({ ...item, profile_id: profileId, sort_order: index }));
  const educationRows = profile.education.map((item, index) => ({ ...item, profile_id: profileId, sort_order: index }));
  const skillRows = profile.skills.filter(Boolean).map((name, index) => ({ profile_id: profileId, name: name.trim(), sort_order: index }));
  const achievementRows = profile.achievements.filter(Boolean).map((value, index) => ({ profile_id: profileId, value: value.trim(), sort_order: index }));

  const inserts = await Promise.all([
    linkRows.length ? supabase.from('profile_links').insert(linkRows) : Promise.resolve({ error: null }),
    experienceRows.length ? supabase.from('experience').insert(experienceRows) : Promise.resolve({ error: null }),
    educationRows.length ? supabase.from('education').insert(educationRows) : Promise.resolve({ error: null }),
    skillRows.length ? supabase.from('skills').insert(skillRows) : Promise.resolve({ error: null }),
    achievementRows.length ? supabase.from('achievements').insert(achievementRows) : Promise.resolve({ error: null }),
  ]);
  const insertError = inserts.find((result) => result.error)?.error;
  if (insertError) throw insertError;
}
