import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, FileText, Save, X, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase, getCurrentUser } from '../lib/supabase';
import { fetchPosts, type Post } from '../lib/content';
import { slugify } from '../lib/slug';
import { formatDate } from '../lib/utils';

const emptyForm = { title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft' as 'draft' | 'published' };

export default function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorView, setEditorView] = useState<'edit' | 'preview'>('edit');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const refreshPosts = async () => {
    try {
      setPosts(await fetchPosts({ publishedOnly: false }));
    } catch {
      setError('Unable to load articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshPosts(); }, []);

  const openCreate = () => {
    setEditingPost(null);
    setFormData(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({ title: post.title, content: post.content, excerpt: post.excerpt, category: post.category, tags: post.tags.join(', '), status: post.status });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('You must be signed in as the owner.');
      const slug = editingPost?.slug || slugify(formData.title) || `post-${Date.now()}`;
      const payload = {
        owner_id: user.id,
        title: formData.title.trim(),
        slug,
        content: formData.content,
        excerpt: formData.excerpt.trim(),
        category: formData.category.trim(),
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        status: formData.status,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error: updateError } = await supabase.from('posts').update(payload).eq('id', editingPost.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('posts').insert(payload);
        if (insertError) throw insertError;
      }
      setIsModalOpen(false);
      setEditingPost(null);
      await refreshPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else await refreshPosts();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-slate-900">Blog Editor</h2><p className="text-slate-500">Manage your articles and draft new thoughts.</p></div><button onClick={openCreate} className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"><Plus size={18} />New Article</button></div>
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}</div> : posts.length === 0 ? <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl"><FileText size={48} className="text-slate-200 mb-4" /><p className="text-slate-500">No articles yet. Share your first insight!</p></div> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr><th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Post</th><th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Status</th><th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Date</th><th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => <tr key={post.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-6 py-4"><div className="text-sm font-bold text-slate-900">{post.title}</div><div className="text-xs text-slate-500">{post.category || post.slug}</div></td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{post.status.toUpperCase()}</span></td><td className="px-6 py-4 text-xs text-slate-500">{formatDate(post.published_at || post.created_at)}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openEdit(post)} aria-label="Edit article" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={16} /></button><button onClick={() => handleDelete(post.id)} aria-label="Delete article" className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></div></td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-6xl rounded-3xl bg-white p-8 shadow-2xl h-[90vh] flex flex-col mx-4">
              <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-bold text-slate-900">{editingPost ? 'Edit Article' : 'Draft New Article'}</h3><button onClick={() => setIsModalOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-slate-100 text-slate-400"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="post-title" className="text-sm font-semibold text-slate-700">Title</label><input id="post-title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div><div className="space-y-2"><label htmlFor="post-category" className="text-sm font-semibold text-slate-700">Category</label><input id="post-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Engineering, Design, Tutorials..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div></div>
                <div className="space-y-2"><label htmlFor="post-excerpt" className="text-sm font-semibold text-slate-700">Excerpt (Brief Summary)</label><input id="post-excerpt" required value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div>
                <div className="space-y-2"><label htmlFor="post-tags" className="text-sm font-semibold text-slate-700">Tags (comma separated)</label><input id="post-tags" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div>
                <div className="lg:hidden flex border-b border-slate-100"><button type="button" onClick={() => setEditorView('edit')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${editorView === 'edit' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Edit</button><button type="button" onClick={() => setEditorView('preview')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${editorView === 'preview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Preview</button></div>
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                  <div className={`flex flex-col h-full bg-white ${editorView === 'preview' ? 'hidden lg:flex' : 'flex'}`}><div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Editor</label><span className="text-[9px] text-slate-400 font-medium">Markdown</span></div><textarea required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="flex-1 w-full px-6 py-4 text-slate-900 focus:ring-0 outline-none resize-none font-mono text-sm leading-relaxed" placeholder="Write your article in markdown..." /></div>
                  <div className={`flex flex-col h-full bg-slate-50/30 ${editorView === 'edit' ? 'hidden lg:flex' : 'flex'}`}><div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</label></div><div className="flex-1 w-full px-8 py-6 overflow-y-auto markdown-body prose prose-slate max-w-none">{formData.content ? <ReactMarkdown>{formData.content}</ReactMarkdown> : <div className="flex h-full items-center justify-center text-slate-300 italic text-sm">Content preview will appear here...</div>}</div></div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100"><button type="button" onClick={() => setFormData({ ...formData, status: formData.status === 'published' ? 'draft' : 'published' })} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${formData.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{formData.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}{formData.status.toUpperCase()}</button><div className="flex gap-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel</button><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"><Save size={18} />{saving ? 'Saving...' : editingPost ? 'Update Post' : 'Save & Close'}</button></div></div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
