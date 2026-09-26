import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Trash2, ChevronDown, ChevronUp, Reply, Clock, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Message } from '../lib/content';
import { formatDate } from '../lib/utils';

export default function MessageInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadMessages = async () => {
    try {
      const { data, error: queryError } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setMessages((data || []) as Message[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this message?')) return;
    const { error: deleteError } = await supabase.from('messages').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else await loadMessages();
  };

  const toggleRead = async (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error: updateError } = await supabase.from('messages').update({ read_at: msg.read_at ? null : new Date().toISOString() }).eq('id', msg.id);
    if (updateError) setError(updateError.message);
    else await loadMessages();
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />)}</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Message Inbox</h2><p className="text-slate-500">Inquiries and messages from your portfolio contact form.</p></div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-indigo-600" /><span className="text-xs font-bold text-slate-600">{messages.length} Total</span></div><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-bold text-slate-600">{messages.filter((m) => !m.read_at).length} New</span></div></div>
      </div>
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="space-y-4">
        {messages.length === 0 ? <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl"><Mail size={48} className="text-slate-200 mb-4" /><p className="text-slate-500">Your inbox is empty. Waiting for the first connection!</p></div> : messages.map((msg) => (
          <motion.div key={msg.id} layout className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${expandedId === msg.id ? 'border-indigo-200 bg-indigo-50/30' : msg.read_at ? 'border-slate-200 bg-white shadow-sm' : 'border-indigo-100 bg-indigo-50/10'}`}>
            <div className="flex items-center gap-4 p-5">
              <button onClick={(e) => toggleRead(msg, e)} aria-label={msg.read_at ? 'Mark as unread' : 'Mark as read'} className={`flex-shrink-0 transition-colors ${msg.read_at ? 'text-slate-300 hover:text-slate-400' : 'text-indigo-600'}`}>{msg.read_at ? <CheckCircle2 size={20} /> : <Circle size={20} className="fill-indigo-600/10" />}</button>
              <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}>
                <div className="flex items-center gap-3 mb-1"><span className={`text-sm font-bold ${msg.read_at ? 'text-slate-700' : 'text-slate-900'}`}>{msg.name}</span>{!msg.read_at && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}</div>
                <div className="flex items-center gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock size={12} />{formatDate(msg.created_at)}</span><span className="font-bold text-indigo-600/70">{msg.subject}</span></div>
              </div>
              <div className="flex items-center gap-2"><button onClick={(e) => handleDelete(msg.id, e)} aria-label="Delete message" className="p-2 text-slate-400 hover:text-red-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button><button onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)} aria-label="Expand message" className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">{expandedId === msg.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button></div>
            </div>
            <AnimatePresence>
              {expandedId === msg.id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-indigo-100/50"><div className="p-6 pt-2"><div className="mb-6 flex flex-wrap gap-6 border-b border-indigo-100/30 pb-6"><div className="space-y-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p><p className="text-sm font-medium text-slate-900">{msg.email}</p></div><div className="space-y-1"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sent From</p><p className="text-sm font-medium text-slate-900">Portfolio Contact Form</p></div></div><div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</div><div className="mt-8 flex justify-end gap-3"><button onClick={() => window.location.href = `mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800"><Reply size={16} />Reply via Email</button></div></div></motion.div>}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
