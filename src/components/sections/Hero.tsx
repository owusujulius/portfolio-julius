import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Code, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfile, type ProfileData } from '../../lib/profile';

export default function Hero() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const intro = profile?.name ? `Hi, I'm ${profile.name}.` : 'I build solutions that scale and inspire.';
  const summary = profile?.bio || 'Full-stack developer specializing in modern web technologies. From concept to deployment, I craft high-performance applications with a focus on user experience.';

  return (
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-50 blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-50 blur-3xl opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200">
            <Sparkles size={14} /><span>Available for new projects</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            {intro}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {summary}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/projects" className="group inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">View My Work<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link to="/contact" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50">Contact Me</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="mt-20 grid grid-cols-2 gap-8 text-slate-500 sm:grid-cols-4 lg:grid-cols-6">
            {['React', 'TypeScript', 'Node.js', 'Supabase', 'SQL', 'Cloud'].map((skill) => <div key={skill} className="flex items-center justify-center space-x-2 text-slate-600"><Code size={16} /><span className="text-sm font-medium">{skill}</span></div>)}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
