import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Save, 
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
  createdAt: any;
}

export default function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorView, setEditorView] = useState<'edit' | 'preview'>('edit');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    status: 'draft' as 'draft' | 'published',
  });

  const path = 'posts';

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Blog Manager: Initiating submission...');
    setSaving(true);
    
    const data = {
      title: formData.title.trim(),
      content: formData.content,
      excerpt: formData.excerpt.trim(),
      category: formData.category.trim(),
      status: formData.status,
    };

    try {
      if (editingPost) {
        console.log('Blog Manager: Updating post', editingPost.id);
        const docRef = doc(db, path, editingPost.id);
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      } else {
        console.log('Blog Manager: Creating new post');
        await addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
      }
      console.log('Blog Manager: Success');
      setIsModalOpen(false);
      setEditingPost(null);
      setFormData({ title: '', content: '', excerpt: '', category: '', status: 'draft' });
      fetchPosts();
    } catch (error) {
      console.error('Blog Manager Error details:', error);
      handleFirestoreError(error, editingPost ? OperationType.UPDATE : OperationType.CREATE, path);
      alert('Failed to save article. Check your connection and admin privileges.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, path, id));
      fetchPosts();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category || '',
      status: post.status,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Blog Editor</h2>
          <p className="text-slate-500">Manage your articles and draft new thoughts.</p>
        </div>
        <button
          onClick={() => {
            setEditingPost(null);
            setFormData({ title: '', content: '', excerpt: '', category: '', status: 'draft' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Plus size={18} />
          New Article
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <FileText size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500">No articles yet. Share your first insight!</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Post</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{post.title}</div>
                    <div className="text-xs text-slate-500">{post.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {post.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {post.createdAt ? formatDate(post.createdAt.toDate()) : 'Recently'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(post)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-6xl rounded-3xl bg-white p-8 shadow-2xl h-[90vh] flex flex-col mx-4"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingPost ? 'Edit Article' : 'Draft New Article'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Title</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Category / Tags</label>
                    <input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Engineering, Design, Tutorials..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Excerpt (Brief Summary)</label>
                  <input
                    required
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="lg:hidden flex border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditorView('edit')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${editorView === 'edit' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorView('preview')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${editorView === 'preview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
                  >
                    Preview
                  </button>
                </div>

                <div className="flex-1 min-h-0 bento-grid-split grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                  <div className={`flex flex-col h-full bg-white ${editorView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Editor</label>
                      <span className="text-[9px] text-slate-400 font-medium">Markdown</span>
                    </div>
                    <textarea
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="flex-1 w-full px-6 py-4 text-slate-900 focus:ring-0 outline-none resize-none font-mono text-sm leading-relaxed"
                      placeholder="Write your article in markdown..."
                    />
                  </div>

                  <div className={`flex flex-col h-full bg-slate-50/30 ${editorView === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</label>
                    </div>
                    <div className="flex-1 w-full px-8 py-6 overflow-y-auto markdown-body prose prose-slate max-w-none">
                      {formData.content ? (
                        <ReactMarkdown>{formData.content}</ReactMarkdown>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300 italic text-sm">
                          Content preview will appear here...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: formData.status === 'published' ? 'draft' : 'published' })}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                        formData.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {formData.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}
                      {formData.status.toUpperCase()}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : (editingPost ? 'Update Post' : 'Save & Close')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
