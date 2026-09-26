import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Instagram, MessageSquare } from 'lucide-react';
import { getProfile, type ProfileData } from '../../lib/profile';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const socials = profile?.socials;
  const email = profile?.email || 'mensahayford777@gmail.com';

  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">My Portfolio</span>
            </Link>
            <p className="mt-2 text-sm text-slate-600">
              Building high-quality digital experiences with passion.
            </p>
          </div>

          <div className="flex space-x-6">
            {socials?.github && (
              <a href={socials.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-500 hover:text-slate-700 transition-colors">
                <Github size={20} />
              </a>
            )}
            {socials?.twitter && (
              <a href={socials.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-slate-500 hover:text-indigo-600 transition-colors">
                <Twitter size={20} />
              </a>
            )}
            {socials?.linkedin && (
              <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-500 hover:text-blue-600 transition-colors">
                <Linkedin size={20} />
              </a>
            )}
            <a href={`mailto:${email}`} aria-label="Email" className="text-slate-500 hover:text-indigo-500 transition-colors">
              <Mail size={20} />
            </a>
            {socials?.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-500 hover:text-pink-600 transition-colors">
                <Instagram size={20} />
              </a>
            )}
            {socials?.whatsapp && (
              <a href={`https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-slate-500 hover:text-emerald-600 transition-colors">
                <MessageSquare size={20} />
              </a>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-8 text-center md:text-left">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} My Portfolio. All rights reserved. Built with React, Supabase & TypeScript.
          </p>
        </div>
      </div>
    </footer>
  );
}
