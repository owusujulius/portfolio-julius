import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Briefcase, GraduationCap, Trophy, Wrench, Globe, Mail, Phone, MapPin, Camera, Image as ImageIcon, X } from 'lucide-react';
import { getCurrentUser } from '../lib/supabase';
import { createEmptyProfile, getProfile, saveProfile, type Education, type Experience, type ProfileData } from '../lib/profile';
import { getPublicAssetUrl, uploadPortfolioAsset } from '../lib/storage';

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('You must be signed in as the owner.');
        const loaded = await getProfile();
        if (active) setProfile(loaded || createEmptyProfile(user.id));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load profile settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setSaved(false);
    setProfile((current) => current ? { ...current, [key]: value } : current);
  };

  const updateSocial = (key: keyof ProfileData['socials'], value: string) => {
    if (!profile) return;
    update('socials', { ...profile.socials, [key]: value });
  };

  const addItem = (field: 'experience' | 'education' | 'skills' | 'achievements') => {
    if (!profile) return;
    if (field === 'experience') update('experience', [...profile.experience, { company: '', role: '', period: '', description: '' }]);
    if (field === 'education') update('education', [...profile.education, { school: '', degree: '', period: '' }]);
    if (field === 'skills') update('skills', [...profile.skills, '']);
    if (field === 'achievements') update('achievements', [...profile.achievements, '']);
  };

  const removeItem = (field: 'experience' | 'education' | 'skills' | 'achievements', index: number) => {
    if (!profile) return;
    const next = [...(profile[field] as any[])];
    next.splice(index, 1);
    update(field, next as any);
  };

  const updateExperience = (index: number, key: keyof Experience, value: string) => {
    if (!profile) return;
    const next = [...profile.experience];
    next[index] = { ...next[index], [key]: value };
    update('experience', next);
  };

  const updateEducation = (index: number, key: keyof Education, value: string) => {
    if (!profile) return;
    const next = [...profile.education];
    next[index] = { ...next[index], [key]: value };
    update('education', next);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Images must be image files smaller than 5 MB.');
      return;
    }
    try {
      const path = await uploadPortfolioAsset(file, 'profile');
      if (field === 'avatar') setProfile({ ...profile, avatarPath: path, avatarUrl: getPublicAssetUrl(path) });
      else setProfile({ ...profile, logoPath: path, logoUrl: getPublicAssetUrl(path) });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload image.');
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    try {
      await saveProfile(profile);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-96 bg-white rounded-3xl" /></div>;
  if (!profile) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Profile unavailable.'}</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between"><div><h2 className="text-3xl font-bold text-slate-900">Profile & Resume Builder</h2><p className="text-slate-500">Your professional identity across the site and your resume.</p></div><button onClick={() => void handleSave()} disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"><Save size={18} />{saving ? 'Saving...' : 'Save All Changes'}</button></div>
      {(error || saved) && <div role="status" className={`rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || 'Profile saved successfully.'}</div>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Camera size={16} />Asset Management</h3>
            <div className="space-y-4">
              <div><label htmlFor="logo-upload" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Site Logo</label><div className="mt-1 relative aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">{profile.logoUrl ? <img src={profile.logoUrl} alt="Site logo" className="h-full w-full object-contain p-4" /> : <ImageIcon className="text-slate-300" />}<input id="logo-upload" type="file" accept="image/*" onChange={(e) => void handleImageUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" /></div></div>
              <div><label htmlFor="avatar-upload" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Profile Photo</label><div className="mt-1 relative aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-300" />}<input id="avatar-upload" type="file" accept="image/*" onChange={(e) => void handleImageUpload(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer" /></div></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Globe size={16} />Contact & Socials</h3>
            <div className="space-y-4">
              {([{ label: 'Email', key: 'email', icon: Mail }, { label: 'Phone', key: 'phone', icon: Phone }, { label: 'Location', key: 'location', icon: MapPin }] as const).map((item) => <div key={item.key}><label htmlFor={`profile-${item.key}`} className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</label><div className="mt-1 relative"><item.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input id={`profile-${item.key}`} value={profile[item.key]} onChange={(e) => update(item.key, e.target.value)} className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-100 bg-slate-50" /></div></div>)}
              <div><label htmlFor="profile-resume" className="text-[10px] font-bold text-slate-500 uppercase">Resume URL</label><input id="profile-resume" value={profile.resumeUrl} onChange={(e) => update('resumeUrl', e.target.value)} placeholder="https://..." className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-100 bg-slate-50" /></div>
              <div className="pt-4 border-t border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Social Profiles</p><div className="space-y-3">{(['github', 'linkedin', 'twitter', 'instagram', 'whatsapp'] as const).map((key) => <div key={key}><label htmlFor={`social-${key}`} className="text-[9px] font-bold text-slate-500 uppercase">{key}</label><input id={`social-${key}`} value={profile.socials[key]} onChange={(e) => updateSocial(key, e.target.value)} placeholder={key === 'whatsapp' ? 'Phone number' : 'https://...'} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-100 bg-slate-50 focus:bg-white" /></div>)}</div></div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><h3 className="text-lg font-bold mb-6">General Information</h3><div className="grid grid-cols-2 gap-4 mb-4"><div className="space-y-1"><label htmlFor="profile-name" className="text-xs font-semibold">Full Name</label><input id="profile-name" value={profile.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200" /></div><div className="space-y-1"><label htmlFor="profile-role" className="text-xs font-semibold">Job Title</label><input id="profile-role" value={profile.role} onChange={(e) => update('role', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200" /></div></div><div className="space-y-1"><label htmlFor="profile-bio" className="text-xs font-semibold">Bio / Summary</label><textarea id="profile-bio" rows={4} value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200" /></div></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold flex items-center gap-2"><Briefcase size={20} className="text-indigo-600" />Experience</h3><button type="button" onClick={() => addItem('experience')} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full"><Plus size={14} className="inline mr-1" />Add Role</button></div><div className="space-y-4">{profile.experience.map((exp, i) => <div key={i} className="p-4 rounded-2xl border border-slate-100 space-y-3 relative group"><button onClick={() => removeItem('experience', i)} aria-label="Remove experience" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={16} /></button><div className="grid grid-cols-2 gap-3"><input aria-label="Company" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} className="text-sm font-bold bg-transparent border-b border-transparent focus:border-indigo-600 outline-none" /><input aria-label="Period" placeholder="Period" value={exp.period} onChange={(e) => updateExperience(i, 'period', e.target.value)} className="text-xs text-right bg-transparent border-b border-transparent focus:border-indigo-600 outline-none" /></div><input aria-label="Role" placeholder="Role" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} className="text-xs text-indigo-600 bg-transparent w-full" /><textarea aria-label="Description" placeholder="Description of achievements..." value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} className="w-full text-xs text-slate-500 bg-transparent outline-none h-20" /></div>)}</div></section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold flex items-center gap-2"><GraduationCap size={20} className="text-indigo-600" />Education</h3><button type="button" onClick={() => addItem('education')} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full"><Plus size={14} className="inline mr-1" />Add School</button></div><div className="space-y-4">{profile.education.map((edu, i) => <div key={i} className="p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 relative group"><button onClick={() => removeItem('education', i)} aria-label="Remove education" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={16} /></button><input aria-label="School" placeholder="School name" value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} className="text-sm font-bold bg-transparent" /><input aria-label="Degree" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} className="text-xs text-indigo-600 bg-transparent" /><input aria-label="Period" placeholder="Period" value={edu.period} onChange={(e) => updateEducation(i, 'period', e.target.value)} className="text-xs text-right bg-transparent" /></div>)}</div></section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm h-full"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold flex items-center gap-2"><Wrench size={16} />Skills</h3><button type="button" onClick={() => addItem('skills')} aria-label="Add skill" className="p-1 rounded-full bg-slate-100"><Plus size={14} /></button></div><div className="flex flex-wrap gap-2">{profile.skills.map((skill, i) => <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold"><input aria-label={`Skill ${i + 1}`} className="bg-transparent outline-none w-20" value={skill} onChange={(e) => { const next = [...profile.skills]; next[i] = e.target.value; update('skills', next); }} /><button type="button" onClick={() => removeItem('skills', i)} aria-label="Remove skill"><X size={12} /></button></div>)}</div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm h-full"><div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold flex items-center gap-2"><Trophy size={16} />Achievements</h3><button type="button" onClick={() => addItem('achievements')} aria-label="Add achievement" className="p-1 rounded-full bg-slate-100"><Plus size={14} /></button></div><div className="space-y-2">{profile.achievements.map((achievement, i) => <div key={i} className="flex items-center gap-2 border-b border-slate-50 py-1"><input aria-label={`Achievement ${i + 1}`} className="flex-1 text-xs text-slate-600 outline-none" value={achievement} onChange={(e) => { const next = [...profile.achievements]; next[i] = e.target.value; update('achievements', next); }} /><button type="button" onClick={() => removeItem('achievements', i)} aria-label="Remove achievement"><X size={12} /></button></div>)}</div></section>
          </div>
        </div>
      </div>
    </div>
  );
}
