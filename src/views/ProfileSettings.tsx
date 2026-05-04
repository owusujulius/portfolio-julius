import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Briefcase, 
  GraduationCap, 
  Trophy, 
  Wrench,
  Globe,
  Mail,
  Phone,
  MapPin,
  Camera,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { compressImage } from '../lib/imageUtils';

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  period: string;
}

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    role: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: '',
    logoUrl: '',
    resumeUrl: '',
    socials: {
      github: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      whatsapp: '',
    },
    experience: [] as Experience[],
    education: [] as Education[],
    skills: [] as string[],
    achievements: [] as string[]
  });

  const docId = 'main';
  const path = `profile/${docId}`;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const snap = await getDoc(doc(db, 'profile', docId));
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            ...profile,
            ...data,
            experience: data.experience || [],
            education: data.education || [],
            skills: data.skills || [],
            achievements: data.achievements || [],
            socials: { ...profile.socials, ...data.socials }
          });
        }
      } catch (error) {
        console.warn("Profile fetch failed, using defaults", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'profile', docId), profile);
      alert('Profile & Resume data saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 5) return alert('File too large (>5MB)');
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, field === 'logoUrl' ? 400 : 1200);
        setProfile(prev => ({ ...prev, [field]: compressed }));
      } catch (err) {
        console.error('Compression failed', err);
        setProfile(prev => ({ ...prev, [field]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addItem = (field: 'experience' | 'education' | 'skills' | 'achievements') => {
    if (field === 'experience') {
      setProfile({ ...profile, experience: [...profile.experience, { company: '', role: '', period: '', description: '' }] });
    } else if (field === 'education') {
      setProfile({ ...profile, education: [...profile.education, { school: '', degree: '', period: '' }] });
    } else if (field === 'skills') {
      setProfile({ ...profile, skills: [...profile.skills, ''] });
    } else if (field === 'achievements') {
      setProfile({ ...profile, achievements: [...profile.achievements, ''] });
    }
  };

  const removeItem = (field: 'experience' | 'education' | 'skills' | 'achievements', index: number) => {
    const next = [...(profile[field] as any[])];
    next.splice(index, 1);
    setProfile({ ...profile, [field]: next });
  };

  const updateItem = (field: 'experience' | 'education', index: number, key: string, value: string) => {
    const next = [...(profile[field] as any[])];
    next[index] = { ...next[index], [key]: value };
    setProfile({ ...profile, [field]: next });
  };

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-96 bg-white rounded-3xl" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Profile & Resume Builder</h2>
          <p className="text-slate-500">Your professional identity across the site and your resume.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Media & Branding */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Camera size={16} /> Asset Management
            </h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Site Logo</label>
                  <div className="mt-1 relative group aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                    {profile.logoUrl ? <img src={profile.logoUrl} className="h-full w-full object-contain p-4" /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Profile Photo (Resume)</label>
                  <div className="mt-1 relative group aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatarUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Globe size={16} /> Contact & Socials
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Email', key: 'email', icon: Mail },
                   { label: 'Phone', key: 'phone', icon: Phone },
                   { label: 'Location', key: 'location', icon: MapPin },
                 ].map((item) => (
                   <div key={item.key}>
                     <label className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</label>
                     <div className="mt-1 relative">
                        <item.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                         value={(profile as any)[item.key]} 
                         onChange={(e) => setProfile({ ...profile, [item.key]: e.target.value })}
                         className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-100 bg-slate-50" 
                        />
                     </div>
                   </div>
                 ))}

                 <div className="pt-4 border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Social Profiles</p>
                   <div className="space-y-3">
                     {[
                       { label: 'GitHub URL', key: 'github' },
                       { label: 'LinkedIn URL', key: 'linkedin' },
                       { label: 'Twitter URL', key: 'twitter' },
                       { label: 'Instagram URL', key: 'instagram' },
                       { label: 'WhatsApp Number', key: 'whatsapp' },
                     ].map((item) => (
                       <div key={item.key}>
                         <label className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</label>
                         <input 
                           value={(profile.socials as any)[item.key]} 
                           onChange={(e) => setProfile({ 
                             ...profile, 
                             socials: { ...profile.socials, [item.key]: e.target.value } 
                           })}
                           className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-100 bg-slate-50 focus:bg-white transition-colors" 
                           placeholder={`https://...`}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
          </section>
        </div>

        {/* Right Column: Content Sections */}
        <div className="lg:col-span-2 space-y-6">
           <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6">General Information</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Full Name</label>
                  <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Job Title</label>
                  <input value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Bio / Summary</label>
                <textarea rows={4} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200" />
              </div>
           </section>

           {/* Experience Section */}
           <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><Briefcase size={20} className="text-indigo-600"/> Experience</h3>
                <button type="button" onClick={() => addItem('experience')} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full"><Plus size={14} className="inline mr-1" /> Add Role</button>
              </div>
              <div className="space-y-4">
                {profile.experience.map((exp, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 space-y-3 relative group">
                    <button onClick={() => removeItem('experience', i)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 size={16} /></button>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Company" value={exp.company} onChange={e => updateItem('experience', i, 'company', e.target.value)} className="text-sm font-bold bg-transparent border-b border-transparent focus:border-indigo-600 outline-none" />
                      <input placeholder="Period (e.g. 2020 - Present)" value={exp.period} onChange={e => updateItem('experience', i, 'period', e.target.value)} className="text-xs text-right bg-transparent border-b border-transparent focus:border-indigo-600 outline-none" />
                    </div>
                    <input placeholder="Role" value={exp.role} onChange={e => updateItem('experience', i, 'role', e.target.value)} className="text-xs text-indigo-600 bg-transparent w-full" />
                    <textarea placeholder="Description of achievements..." value={exp.description} onChange={e => updateItem('experience', i, 'description', e.target.value)} className="w-full text-xs text-slate-500 bg-transparent outline-none h-20" />
                  </div>
                ))}
              </div>
           </section>

           {/* Education Section */}
           <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><GraduationCap size={20} className="text-indigo-600"/> Education</h3>
                <button type="button" onClick={() => addItem('education')} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-full"><Plus size={14} className="inline mr-1" /> Add School</button>
              </div>
              <div className="space-y-4">
                {profile.education.map((edu, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 relative group">
                    <button onClick={() => removeItem('education', i)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={16} /></button>
                    <input placeholder="School name" value={edu.school} onChange={e => updateItem('education', i, 'school', e.target.value)} className="text-sm font-bold bg-transparent" />
                    <input placeholder="Degree" value={edu.degree} onChange={e => updateItem('education', i, 'degree', e.target.value)} className="text-xs text-indigo-600 bg-transparent" />
                    <input placeholder="Period" value={edu.period} onChange={e => updateItem('education', i, 'period', e.target.value)} className="text-xs text-right bg-transparent" />
                  </div>
                ))}
              </div>
           </section>

           {/* Skills & Achievements */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Wrench size={16} /> Skills</h3>
                  <button onClick={() => addItem('skills')} className="p-1 rounded-full bg-slate-100"><Plus size={14} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold">
                      <input className="bg-transparent outline-none w-20" value={skill} onChange={(e) => {
                        const next = [...profile.skills];
                        next[i] = e.target.value;
                        setProfile({...profile, skills: next});
                      }} />
                      <button onClick={() => removeItem('skills', i)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Trophy size={16} /> Achievements</h3>
                  <button onClick={() => addItem('achievements')} className="p-1 rounded-full bg-slate-100"><Plus size={14} /></button>
                </div>
                <div className="space-y-2">
                  {profile.achievements.map((ach, i) => (
                    <div key={i} className="flex items-center gap-2 border-b border-slate-50 py-1">
                      <input className="flex-1 bg-transparent text-xs text-slate-600 outline-none" value={ach} onChange={(e) => {
                        const next = [...profile.achievements];
                        next[i] = e.target.value;
                        setProfile({...profile, achievements: next});
                      }} />
                      <button onClick={() => removeItem('achievements', i)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
}
