import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Instagram, MessageSquare } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [socials, setSocials] = useState<any>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'profile', 'main'), (doc) => {
      if (doc.exists()) setSocials(doc.data().socials);
    });
  }, []);

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
              <a href={socials.github} target="_blank" className="text-slate-500 hover:text-slate-700 transition-colors">
                <Github size={20} />
              </a>
            )}
            {socials?.twitter && (
              <a href={socials.twitter} target="_blank" className="text-slate-500 hover:text-indigo-600 transition-colors">
                <Twitter size={20} />
              </a>
            )}
            {socials?.linkedin && (
              <a href={socials.linkedin} target="_blank" className="text-slate-500 hover:text-blue-600 transition-colors">
                <Linkedin size={20} />
              </a>
            )}
            <a href="mailto:mensahayford777@gmail.com" className="text-slate-500 hover:text-indigo-500 transition-colors">
              <Mail size={20} />
            </a>
            {socials?.instagram && (
              <a href={socials.instagram} target="_blank" className="text-slate-500 hover:text-pink-600 transition-colors">
                <Instagram size={20} />
              </a>
            )}
            {socials?.whatsapp && (
              <a href={`https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-slate-500 hover:text-emerald-600 transition-colors">
                <MessageSquare size={20} />
              </a>
            )}
          </div>
        </div>
 
        <div className="mt-12 border-t border-slate-100 pt-8 text-center md:text-left">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} My Portfolio. All rights reserved. Built with React & Firebase.
          </p>
        </div>
      </div>
    </footer>
  );
}
