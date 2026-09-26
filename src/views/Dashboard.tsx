import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FolderKanban, FileText, Inbox, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

interface RecentMessage {
  id: string;
  name: string;
  subject: string;
  message: string;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, posts: 0, messages: 0 });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      try {
        const [projects, posts, messages, recent] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('posts').select('id', { count: 'exact', head: true }),
          supabase.from('messages').select('id', { count: 'exact', head: true }),
          supabase.from('messages').select('id,name,subject,message,created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        if (projects.error || posts.error || messages.error || recent.error) throw new Error('Dashboard query failed');
        if (!active) return;
        setStats({ projects: projects.count || 0, posts: posts.count || 0, messages: messages.count || 0 });
        setRecentMessages(recent.data || []);
      } catch {
        if (active) setError('Dashboard data is temporarily unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchStats();
    return () => { active = false; };
  }, []);

  const statCards = [
    { name: 'Total Projects', value: stats.projects, icon: FolderKanban, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Blog Posts', value: stats.posts, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Inquiries', value: stats.messages, icon: Inbox, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Welcome back <Sparkles className="text-indigo-600" size={24} /></h1>
        <p className="text-slate-500">Here's what's happening with your portfolio.</p>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {statCards.map((card) => (
          <motion.div key={card.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}><card.icon size={24} /></div>
              <div><p className="text-sm font-medium text-slate-500">{card.name}</p><p className="text-2xl font-bold text-slate-900">{loading ? '—' : card.value}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Recent Inquiries</h3>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">Inbox</span>
          </div>
          <div className="divide-y divide-slate-50">
            {recentMessages.length === 0 ? <div className="p-10 text-center text-slate-500">No messages yet.</div> : recentMessages.map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-900">{msg.name}</p><p className="text-xs text-slate-500">{formatDate(msg.created_at)}</p></div>
                <p className="text-xs font-medium text-indigo-600 mt-1">{msg.subject}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{msg.message}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-indigo-600 p-8 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div><h3 className="text-xl font-bold">Portfolio Growth</h3><p className="mt-2 text-indigo-100 text-sm">Keep building and sharing! Your digital footprint is expanding every day.</p></div>
            <div className="mt-8 flex items-baseline gap-2"><span className="text-4xl font-bold">85%</span><span className="text-indigo-200 text-xs">Profile Completion</span></div>
            <div className="mt-4 w-full h-1.5 bg-indigo-500/30 rounded-full"><div className="w-[85%] h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" /></div>
          </div>
          <TrendingUp className="absolute right-[-20%] bottom-[-10%] text-indigo-500 opacity-20" size={240} />
        </section>
      </div>
    </div>
  );
}
