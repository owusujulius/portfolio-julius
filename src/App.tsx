import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { supabaseConfigured } from './lib/supabase';

const Home = lazy(() => import('./views/Home'));
const Projects = lazy(() => import('./views/Projects'));
const Blog = lazy(() => import('./views/Blog'));
const BlogDetail = lazy(() => import('./views/BlogDetail'));
const Contact = lazy(() => import('./views/Contact'));
const Admin = lazy(() => import('./views/Admin'));
const Resume = lazy(() => import('./views/Resume'));

function ConfigurationNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Setup required</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Connect Supabase to continue</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The portfolio is ready for the Supabase migration. Add your public Supabase URL and anon key
          to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env.local</code>, then restart the dev server.
        </p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
          <div>VITE_SUPABASE_URL</div>
          <div>VITE_SUPABASE_ANON_KEY</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  if (!supabaseConfigured) return <ConfigurationNotice />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/admin/*" element={<Admin />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
