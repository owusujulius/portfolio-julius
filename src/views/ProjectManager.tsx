import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Code, 
  Save, 
  X,
  AlertTriangle,
  FolderKanban,
  Image as ImageIcon
} from 'lucide-react';
import { compressImage } from '../lib/imageUtils';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  techStack?: string[];
  liveUrl?: string;
  githubUrl?: string;
  createdAt: any;
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    techStack: '',
    liveUrl: '',
    githubUrl: '',
  });

  const path = 'projects';

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Project Manager: Initiating submission...');
    setSaving(true);
    
    try {
      // Process tech stack string to array
      const cleanTechStack = formData.techStack.split(',').map(s => s.trim()).filter(Boolean);
      
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl,
        techStack: cleanTechStack,
        liveUrl: formData.liveUrl.trim(),
        githubUrl: formData.githubUrl.trim(),
      };

      if (editingProject) {
        console.log('Project Manager: Updating projectID:', editingProject.id);
        const docRef = doc(db, path, editingProject.id);
        // Note: rule requires createdAt to stay unchanged. 
        // We don't include it in updateDoc, so Firestore leaves it alone.
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      } else {
        console.log('Project Manager: Creating new project');
        await addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
      }
      
      console.log('Project Manager: Save successful');
      setIsModalOpen(false);
      setEditingProject(null);
      setFormData({ title: '', description: '', imageUrl: '', techStack: '', liveUrl: '', githubUrl: '' });
      fetchProjects();
    } catch (error) {
      console.error('Project Manager Error details:', error);
      handleFirestoreError(error, editingProject ? OperationType.UPDATE : OperationType.CREATE, path);
      alert('Failed to save project. Check your image size (max ~1MB) and ensure you are logged in as admin.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteDoc(doc(db, path, id));
      fetchProjects();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      imageUrl: project.imageUrl || '',
      techStack: project.techStack?.join(', ') || '',
      liveUrl: project.liveUrl || '',
      githubUrl: project.githubUrl || '',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Management</h2>
          <p className="text-slate-500">Add, edit, or remove showcase projects.</p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setFormData({ title: '', description: '', imageUrl: '', techStack: '', liveUrl: '', githubUrl: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <FolderKanban size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500">Start by adding your first masterpiece!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg">
              <div className="aspect-video w-full bg-slate-100 relative">
                {project.imageUrl ? (
                  <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Code size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(project)} className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm hover:bg-indigo-50"><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(project.id)} className="p-2 bg-white rounded-lg text-red-600 shadow-sm hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900">{project.title}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{project.description}</p>
              </div>
            </div>
          ))}
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
              className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Project Title</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Project Image</label>
                    <div className="relative group flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors bg-slate-50 overflow-hidden">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-300" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1024 * 1024 * 5) return alert('Image too large (>5MB)');
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              try {
                                const compressed = await compressImage(reader.result as string);
                                setFormData({ ...formData, imageUrl: compressed });
                              } catch (err) {
                                console.error('Compression failed', err);
                                setFormData({ ...formData, imageUrl: reader.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tech Stack (comma separated)</label>
                  <input
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="React, TypeScript, Tailwind..."
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Live URL</label>
                    <input
                      value={formData.liveUrl}
                      onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">GitHub URL</label>
                    <input
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : (editingProject ? 'Save Changes' : 'Create Project')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
