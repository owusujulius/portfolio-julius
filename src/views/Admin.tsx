import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, loginWithGoogle } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Inbox, 
  LogOut, 
  Settings,
  ShieldCheck,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './Dashboard';
import ProjectManager from './ProjectManager';
import BlogManager from './BlogManager';
import MessageInbox from './MessageInbox';
import ProfileSettings from './ProfileSettings';

const ADMIN_EMAIL = 'mensahayford777@gmail.com';

export default function Admin() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
  </div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Access Required</h2>
          <p className="mt-2 text-slate-600">Please sign in with your authorized admin account to manage your portfolio.</p>
          <button
            onClick={loginWithGoogle}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
          >
            Sign in with Google
          </button>
          <div className="mt-6">
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Manage Projects', icon: FolderKanban, href: '/admin/projects' },
    { name: 'Blog Editor', icon: FileText, href: '/admin/blog' },
    { name: 'Messages', icon: Inbox, href: '/admin/messages' },
    { name: 'Profile Settings', icon: Settings, href: '/admin/profile' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50 flex-col md:flex-row">
      {/* Mobile Sub-Nav */}
      <div className="md:hidden border-b border-slate-200 bg-white px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar sticky top-16 z-40">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs transition-colors ${
              location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href))
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-600 bg-slate-50'
            }`}
          >
            <item.icon size={14} />
            <span>{item.name.replace('Manage ', '').replace(' Editor', '')}</span>
          </Link>
        ))}
      </div>

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-300`}>
        <div className="p-6 flex flex-col h-full">
          <div className="space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                  location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href))
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
          <div className="mt-auto pt-6 border-t border-slate-100">
            <button
              onClick={() => auth.signOut().then(() => navigate('/'))}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectManager />} />
            <Route path="blog" element={<BlogManager />} />
            <Route path="messages" element={<MessageInbox />} />
            <Route path="profile" element={<ProfileSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
