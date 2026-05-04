import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Printer, MapPin, Mail, Phone, Globe, Download, Github, Linkedin, Twitter, Instagram, MessageSquare } from 'lucide-react';

export default function Resume() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'profile', 'main'), (doc) => {
      if (doc.exists()) setProfile(doc.data());
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!profile) return <div className="p-20 text-center text-slate-500">Loading Resume...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-indigo-100">
      <div className="mx-auto max-w-4xl">
        {/* Actions bar - hidden on print */}
        <div className="mb-8 flex justify-end gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            <Printer size={18} />
            Print Resume
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>

        {/* The Actual Resume Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-200/50 print:shadow-none print:rounded-none"
        >
          {/* Top Banner Color */}
          <div className="h-4 bg-indigo-600 w-full" />

          <div className="p-12 sm:p-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between gap-8 mb-12">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 uppercase">
                  {profile.name}
                </h1>
                <p className="text-xl font-medium text-indigo-600 tracking-wide uppercase">{profile.role}</p>
                <div className="flex flex-wrap gap-4 text-slate-600 text-sm">
                  {profile.location && <div className="flex items-center gap-1.5"><MapPin size={14}/> {profile.location}</div>}
                  {profile.email && <div className="flex items-center gap-1.5"><Mail size={14}/> {profile.email}</div>}
                  {profile.phone && <div className="flex items-center gap-1.5"><Phone size={14}/> {profile.phone}</div>}
                </div>
              </div>
              
              {profile.avatarUrl && (
                <div className="h-32 w-32 rounded-3xl bg-slate-100 overflow-hidden ring-4 ring-slate-50">
                   <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Left Column: Summary, Skills, Socials */}
              <div className="md:col-span-1 space-y-10">
                {profile.bio && (
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Profile</h2>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {profile.bio}
                    </p>
                  </section>
                )}

                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Online</h2>
                   <div className="space-y-3">
                      {profile.socials?.github && (
                        <a href={profile.socials.github} target="_blank" className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Github size={16} /> GitHub
                        </a>
                      )}
                      {profile.socials?.linkedin && (
                        <a href={profile.socials.linkedin} target="_blank" className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Linkedin size={16} /> LinkedIn
                        </a>
                      )}
                      {profile.socials?.twitter && (
                        <a href={profile.socials.twitter} target="_blank" className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Twitter size={16} /> Twitter
                        </a>
                      )}
                      {profile.socials?.instagram && (
                        <a href={profile.socials.instagram} target="_blank" className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Instagram size={16} /> Instagram
                        </a>
                      )}
                      {profile.socials?.whatsapp && (
                        <a href={`https://wa.me/${profile.socials.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <MessageSquare size={16} /> WhatsApp
                        </a>
                      )}
                      {profile.resumeUrl && (
                        <a href={profile.resumeUrl} target="_blank" className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                          <Globe size={16} /> Portfolio
                        </a>
                      )}
                   </div>
                </section>
              </div>

              {/* Right Column: Experience, Education, Achievements */}
              <div className="md:col-span-2 space-y-12">
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-4">
                    Experience
                    <div className="h-px flex-1 bg-indigo-100" />
                  </h2>
                  <div className="space-y-8">
                    {profile.experience?.map((exp: any, i: number) => (
                      <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-indigo-400">
                         <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-slate-900 uppercase tracking-tight">{exp.company}</h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{exp.period}</span>
                         </div>
                         <p className="text-sm font-semibold text-indigo-500 mb-2">{exp.role}</p>
                         <p className="text-sm text-slate-500 leading-relaxed italic">
                           {exp.description}
                         </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-4">
                    Education
                    <div className="h-px flex-1 bg-indigo-100" />
                  </h2>
                  <div className="space-y-6">
                    {profile.education?.map((edu: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1">
                           <h3 className="font-bold text-slate-900">{edu.school}</h3>
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{edu.period}</span>
                        </div>
                        <p className="text-sm text-slate-600">{edu.degree}</p>
                      </div>
                    ))}
                   </div>
                </section>

                {profile.achievements?.length > 0 && (
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 flex items-center gap-4">
                      Achievements
                      <div className="h-px flex-1 bg-indigo-100" />
                    </h2>
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-600">
                      {profile.achievements.map((ach: string, i: number) => (
                        <li key={i}>{ach}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* Footer Decoration */}
          <div className="h-1.5 bg-slate-100 w-full" />
        </motion.div>
        
        <p className="mt-8 text-center text-xs text-slate-500 print:hidden italic">
          Designed with ❤️ for a professional showcase.
        </p>
      </div>
    </div>
  );
}
