/*
 * One-time migration from the legacy Firestore database to Supabase.
 *
 * Usage:
 *   npm run migrate:firestore            # dry run; prints planned counts
 *   npm run migrate:firestore -- --apply # writes to Supabase
 *
 * Required environment variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_OWNER_ID
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * The script is intentionally idempotent: projects and posts are upserted by
 * their generated slug, and the profile is upserted by owner_id.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '../src/lib/slug';

const apply = process.argv.includes('--apply');
const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_OWNER_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}

const firebaseApp = getApps()[0] || initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const firestore = getFirestore(firebaseApp);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const ownerId = process.env.SUPABASE_OWNER_ID!;

type LegacyDocument = { id: string; [key: string]: any };

function toIso(value: any, fallback = new Date().toISOString()): string {
  if (value?.toDate) return value.toDate().toISOString();
  if (typeof value === 'string') return new Date(value).toISOString();
  return fallback;
}

function uniqueSlug(title: string, id: string, prefix: string): string {
  const base = slugify(title) || prefix;
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
  return `${base}-${suffix || 'legacy'}`;
}

function extensionForDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || 'jpeg';
}

function toBase64(value: any): string | null {
  if (typeof value !== 'string' || !value.startsWith('data:')) return null;
  const comma = value.indexOf(',');
  return comma >= 0 ? value.slice(comma + 1) : null;
}

async function uploadLegacyImage(value: any, folder: string, legacyId: string): Promise<string | null> {
  if (typeof value !== 'string' || !value) return null;
  if (!value.startsWith('data:')) return value;

  const base64 = toBase64(value);
  if (!base64) return null;
  if (!apply) return `storage/${ownerId}/${folder}/${legacyId}.${extensionForDataUrl(value)}`;

  const extension = extensionForDataUrl(value);
  const path = `${ownerId}/${folder}/${legacyId}.${extension}`;
  const { error } = await supabase.storage.from('portfolio-media').upload(path, Buffer.from(base64, 'base64'), {
    contentType: `image/${extension}`,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

async function readCollection(name: string): Promise<LegacyDocument[]> {
  const snapshot = await firestore.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function migrateProfile(profiles: LegacyDocument[]) {
  const legacy = profiles.find((doc) => doc.id === 'main') || profiles[0];
  if (!legacy) return 0;

  const base = {
    user_id: ownerId,
    name: legacy.name || '',
    role: legacy.role || '',
    bio: legacy.bio || '',
    email: legacy.email || null,
    phone: legacy.phone || null,
    location: legacy.location || null,
    resume_url: legacy.resumeUrl || null,
  };
  const avatarPath = await uploadLegacyImage(legacy.avatarUrl, 'profile', 'avatar');
  const logoPath = await uploadLegacyImage(legacy.logoUrl, 'profile', 'logo');
  Object.assign(base, { avatar_path: avatarPath, logo_path: logoPath });

  let profileId: string | undefined;
  if (apply) {
    const { data, error } = await supabase.from('profiles').upsert(base, { onConflict: 'user_id' }).select('id').single();
    if (error) throw error;
    profileId = data.id;

    const socials = legacy.socials || {};
    const links = Object.entries(socials)
      .filter(([, value]) => typeof value === 'string' && value)
      .map(([platform, url], index) => ({ profile_id: profileId, platform, url, sort_order: index }));
    const experience = (legacy.experience || []).map((item: any, index: number) => ({
      profile_id: profileId,
      company: item.company || '',
      role: item.role || '',
      period: item.period || '',
      description: item.description || '',
      sort_order: index,
    }));
    const education = (legacy.education || []).map((item: any, index: number) => ({
      profile_id: profileId,
      school: item.school || '',
      degree: item.degree || '',
      period: item.period || '',
      sort_order: index,
    }));
    const skills = (legacy.skills || []).filter(Boolean).map((name: string, index: number) => ({ profile_id: profileId, name, sort_order: index }));
    const achievements = (legacy.achievements || []).filter(Boolean).map((value: string, index: number) => ({ profile_id: profileId, value, sort_order: index }));

    await Promise.all([
      supabase.from('profile_links').delete().eq('profile_id', profileId),
      supabase.from('experience').delete().eq('profile_id', profileId),
      supabase.from('education').delete().eq('profile_id', profileId),
      supabase.from('skills').delete().eq('profile_id', profileId),
      supabase.from('achievements').delete().eq('profile_id', profileId),
    ]);
    if (links.length) await supabase.from('profile_links').insert(links);
    if (experience.length) await supabase.from('experience').insert(experience);
    if (education.length) await supabase.from('education').insert(education);
    if (skills.length) await supabase.from('skills').insert(skills);
    if (achievements.length) await supabase.from('achievements').insert(achievements);
  }
  return 1;
}

async function migrateProjects(projects: LegacyDocument[]) {
  let count = 0;
  for (const [index, project] of projects.entries()) {
    const imagePath = await uploadLegacyImage(project.imageUrl, 'projects', project.id);
    const row = {
      owner_id: ownerId,
      title: project.title || 'Untitled project',
      slug: uniqueSlug(project.title || 'project', project.id, 'project'),
      description: project.description || '',
      tech_stack: Array.isArray(project.techStack) ? project.techStack : [],
      live_url: project.liveUrl || null,
      github_url: project.githubUrl || null,
      image_path: imagePath,
      status: 'published',
      featured: false,
      sort_order: index,
      created_at: toIso(project.createdAt),
      updated_at: toIso(project.updatedAt, toIso(project.createdAt)),
    };
    if (apply) {
      const { error } = await supabase.from('projects').upsert(row, { onConflict: 'slug' });
      if (error) throw error;
    }
    count++;
  }
  return count;
}

async function migratePosts(posts: LegacyDocument[]) {
  let count = 0;
  for (const post of posts) {
    const row = {
      owner_id: ownerId,
      title: post.title || 'Untitled post',
      slug: uniqueSlug(post.title || 'post', post.id, 'post'),
      content: post.content || '',
      excerpt: post.excerpt || '',
      category: post.category || '',
      tags: [],
      status: post.status === 'published' ? 'published' : 'draft',
      published_at: post.status === 'published' ? toIso(post.createdAt) : null,
      created_at: toIso(post.createdAt),
      updated_at: toIso(post.updatedAt, toIso(post.createdAt)),
    };
    if (apply) {
      const { error } = await supabase.from('posts').upsert(row, { onConflict: 'slug' });
      if (error) throw error;
    }
    count++;
  }
  return count;
}

async function migrateMessages(messages: LegacyDocument[]) {
  let count = 0;
  for (const message of messages) {
    const row = {
      legacy_id: message.id,
      owner_id: ownerId,
      name: message.name || '',
      email: message.email || '',
      subject: message.subject || '',
      message: message.message || '',
      created_at: toIso(message.createdAt),
      read_at: message.read ? toIso(message.createdAt) : null,
      archived: false,
    };
    if (apply) {
      const { error } = await supabase.from('messages').upsert(row, { onConflict: 'legacy_id' });
      if (error) throw error;
    }
    count++;
  }
  return count;
}

async function main() {
  const [projects, posts, messages, profiles] = await Promise.all([
    readCollection('projects'),
    readCollection('posts'),
    readCollection('messages'),
    readCollection('profile'),
  ]);

  console.log(`${apply ? 'Applying' : 'Planning'} migration:`);
  console.log(`  projects: ${projects.length}`);
  console.log(`  posts: ${posts.length}`);
  console.log(`  messages: ${messages.length}`);
  console.log(`  profile: ${profiles.length ? 1 : 0}`);

  if (!apply) {
    console.log('\nDry run complete. Re-run with --apply after reviewing the Supabase project and backups.');
    return;
  }

  await migrateProfile(profiles);
  await migrateProjects(projects);
  await migratePosts(posts);
  await migrateMessages(messages);
  console.log('\nMigration complete. Verify counts and sample records before switching traffic.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
