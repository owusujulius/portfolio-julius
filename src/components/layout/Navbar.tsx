import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Layout, PenTool, Mail, User, Code, FileText } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { getProfile, type ProfileData } from '../../lib/profile';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    getProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfile(null);
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Layout },
    { name: 'Projects', href: '/projects', icon: Code },
    { name: 'Blog', href: '/blog', icon: PenTool },
    { name: 'Resume', href: '/resume', icon: FileText },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const isAdmin = Boolean(user && profile?.user_id === user.id);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white overflow-hidden shadow-sm">
                {profile?.logoUrl ? (
                  <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Code size={20} />
                )}
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">My Portfolio</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                    location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href))
                      ? 'text-indigo-600'
                      : 'text-slate-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-2" />

              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
          >
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                >
                  <link.icon size={18} />
                  <span>{link.name}</span>
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <User size={18} />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
