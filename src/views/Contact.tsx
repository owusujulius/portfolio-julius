import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, CheckCircle2, Linkedin, Twitter, Instagram } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getProfile, type ProfileData } from '../lib/profile';

const initialForm = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.functions.invoke('contact', {
      body: {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        website: formData.website,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage('We could not send your message right now. Please try again later.');
      return;
    }

    setStatus('success');
    setFormData(initialForm);
  };

  const socials = profile?.socials;

  return (
    <div className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-white px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32">
          <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl" aria-hidden="true">
            <div className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-25" />
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Let's connect</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Whether you have a question or just want to say hi, my inbox is always open.</p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-16 lg:grid-cols-2">
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-base font-semibold leading-7 text-slate-900">Contact Information</h3>
                <dl className="mt-4 space-y-4 text-base leading-7 text-slate-600">
                  <div className="flex gap-x-4">
                    <dt className="flex-none"><Mail className="h-7 w-6 text-indigo-600" /></dt>
                    <dd>{profile?.email || 'mensahayford777@gmail.com'}</dd>
                  </div>
                  {socials?.linkedin && <div className="flex gap-x-4"><dt className="flex-none"><Linkedin className="h-7 w-6 text-indigo-600" /></dt><dd><a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">LinkedIn Profile</a></dd></div>}
                  {socials?.twitter && <div className="flex gap-x-4"><dt className="flex-none"><Twitter className="h-7 w-6 text-indigo-600" /></dt><dd><a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">Twitter / X</a></dd></div>}
                  {socials?.instagram && <div className="flex gap-x-4"><dt className="flex-none"><Instagram className="h-7 w-6 text-indigo-600" /></dt><dd><a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">Instagram</a></dd></div>}
                  {socials?.whatsapp && <div className="flex gap-x-4"><dt className="flex-none"><MessageSquare className="h-7 w-6 text-indigo-600" /></dt><dd><a href={`https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">WhatsApp</a></dd></div>}
                </dl>
              </div>

              <div className="rounded-2xl bg-indigo-50 p-6">
                <h4 className="text-sm font-semibold text-indigo-900">Booking a consultation?</h4>
                <p className="mt-2 text-sm text-indigo-700">I offer code reviews and architectural consultations. Mention 'Consultancy' in your subject line for priority response.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'success' ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center rounded-2xl bg-emerald-50 p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
                  <h3 className="text-lg font-bold text-emerald-900">Message Sent!</h3>
                  <p className="mt-2 text-sm text-emerald-700">Thank you for reaching out. I'll get back to you as soon as possible.</p>
                  <button type="button" onClick={() => setStatus('idle')} className="mt-6 text-sm font-semibold text-emerald-900 underline">Send another message</button>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold leading-6 text-slate-900">Name</label>
                      <input type="text" name="name" id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-2.5 block w-full rounded-xl border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold leading-6 text-slate-900">Email</label>
                      <input type="email" name="email" id="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-2.5 block w-full rounded-xl border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold leading-6 text-slate-900">Subject</label>
                    <input type="text" name="subject" id="subject" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="mt-2.5 block w-full rounded-xl border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold leading-6 text-slate-900">Message</label>
                    <textarea name="message" id="message" rows={4} required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="mt-2.5 block w-full rounded-xl border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                  </div>
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                  </div>
                  {status === 'error' && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
                  <button type="submit" disabled={status === 'loading'} className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50">
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                    <Send size={16} />
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
