import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Lazy load views for better performance
const Home = lazy(() => import('./views/Home'));
const Projects = lazy(() => import('./views/Projects'));
const Blog = lazy(() => import('./views/Blog'));
const BlogDetail = lazy(() => import('./views/BlogDetail'));
const Contact = lazy(() => import('./views/Contact'));
const Admin = lazy(() => import('./views/Admin'));

const Resume = lazy(() => import('./views/Resume'));

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={
            <div className="flex h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resume" element={<Resume />} />
            <Route path="/admin/*" element={<Admin />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
