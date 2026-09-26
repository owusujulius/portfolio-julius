import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Code, Save, X, FolderKanban, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';
import { fetchProjects, type Project } from '../lib/content';
import { uploadPortfolioAsset } from '../lib/storage';
import { slugify } from '../lib/slug';

const emptyForm = {
  title: '',
  description: '',
  techStack: '',
  liveUrl: '',
  githubUrl: '',
  status: 'draft' as 'draft' | 'published',
  featured: false,
  sortOrder: 0,
};

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');

  const refreshProjects = async () => {
    try {
      const data = await fetchProjects({ publishedOnly: false });
      setProjects(data);
    } catch {
      setError('Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      techStack: project.tech_stack.join(', '),
      liveUrl: project.live_url || '',
      githubUrl: project.github_url || '',
      status: project.status,
      featured: project.featured,
      sortOrder: project.sort_order,
    });
    setImageFile(null);
    setImagePreview(project.imageUrl);
    setError('');
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be smaller than 5 MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('You must be signed in as the owner.');

      let imagePath = editingProject?.image_path || null;
      if (imageFile) imagePath = await uploadPortfolioAsset(imageFile, 'projects');

      const techStack = formData.techStack.split(',').map((item) => item.trim()).filter(Boolean);
      const slug = slugify(formData.title) || `project-${Date.now()}`;
      const payload = {
        owner_id: user.id,
        title: formData.title.trim(),
        slug,
        description: formData.description.trim(),
        tech_stack: techStack,
        live_url: formData.liveUrl.trim() || null,
        github_url: formData.githubUrl.trim() || null,
        image_path: imagePath,
        status: formData.status,
        featured: formData.featured,
        sort_order: Number(formData.sortOrder) || 0,
      };

      if (editingProject) {
        const { error: updateError } = await supabase.from('projects').update(payload).eq('id', editingProject.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('projects').insert(payload);
        if (insertError) throw insertError;
      }

      setIsModalOpen(false);
      setEditingProject(null);
      setImageFile(null);
      setImagePreview('');
      await refreshProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else await refreshProjects();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Project Management</h2><p className="text-slate-500">Add, edit, or remove showcase projects.</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"><Plus size={18} />New Project</button>
      </div>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl"><FolderKanban size={48} className="text-slate-200 mb-4" /><p className="text-slate-500">Start by adding your first masterpiece!</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg">
              <div className="aspect-video w-full bg-slate-100 relative">
                {project.imageUrl ? <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><Code size={32} /></div>}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(project)} aria-label="Edit project" className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm hover:bg-indigo-50"><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(project.id)} aria-label="Delete project" className="p-2 bg-white rounded-lg text-red-600 shadow-sm hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
                <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold uppercase text-white">{project.status}</span>
              </div>
              <div className="p-5"><h3 className="font-bold text-slate-900">{project.title}</h3><p className="mt-1 text-xs text-slate-500 line-clamp-2">{project.description}</p></div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8"><h3 className="text-xl font-bold text-slate-900">{editingProject ? 'Edit Project' : 'Add New Project'}</h3><button onClick={() => setIsModalOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-slate-100 text-slate-400"><X size={20} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2"><label htmlFor="project-title" className="text-sm font-semibold text-slate-700">Project Title</label><input id="project-title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div>
                  <div className="space-y-2"><label htmlFor="project-image" className="text-sm font-semibold text-slate-700">Project Image</label><div className="relative group flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors bg-slate-50 overflow-hidden">{imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <ImageIcon size={24} className="text-slate-300" />}<input id="project-image" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} /></div></div>
                </div>
                <div className="space-y-2"><label htmlFor="project-description" className="text-sm font-semibold text-slate-700">Description</label><textarea id="project-description" required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div>
                <div className="space-y-2"><label htmlFor="project-tech" className="text-sm font-semibold text-slate-700">Tech Stack (comma separated)</label><input id="project-tech" value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} placeholder="React, TypeScript, Tailwind..." className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="project-live" className="text-sm font-semibold text-slate-700">Live URL</label><input id="project-live" type="url" value={formData.liveUrl} onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div><div className="space-y-2"><label htmlFor="project-github" className="text-sm font-semibold text-slate-700">GitHub URL</label><input id="project-github" type="url" value={formData.githubUrl} onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" /></div></div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3"><div className="space-y-2"><label htmlFor="project-status" className="text-sm font-semibold text-slate-700">Status</label><select id="project-status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900"><option value="draft">Draft</option><option value="published">Published</option></select></div><div className="space-y-2"><label htmlFor="project-order" className="text-sm font-semibold text-slate-700">Sort order</label><input id="project-order" type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900" /></div><label className="flex items-end gap-2 pb-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />Featured</label></div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel</button><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"><Save size={18} />{saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
