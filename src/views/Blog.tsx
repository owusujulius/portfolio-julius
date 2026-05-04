import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Tag, ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/utils';

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  category?: string;
  createdAt: any;
  status: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchPosts() {
      const path = 'posts';
      try {
        const q = query(
          collection(db, path),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      } catch (error) {
        console.warn("Could not fetch published posts", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    const term = searchTerm.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(term) || 
      (post.excerpt && post.excerpt.toLowerCase().includes(term)) ||
      (post.category && post.category.toLowerCase().includes(term))
    );
  }, [posts, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Blog.</h1>
          <p className="mt-4 text-xl text-slate-600">Sharing knowledge on development, design, and developer life.</p>
        </div>

        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search articles by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-2xl border-0 bg-white py-3 pl-12 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-500">
            {searchTerm ? "No articles found matching your search." : "No blog posts published yet. Check back soon!"}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-indigo-600 font-semibold hover:text-indigo-500"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex flex-col items-start"
              >
                <div className="flex items-center gap-x-4 text-xs">
                  <time dateTime={post.createdAt?.toDate().toISOString()} className="text-slate-500">
                    {formatDate(post.createdAt?.toDate() || new Date())}
                  </time>
                  {post.category && (
                    <span className="relative z-10 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-2xl font-bold leading-6 text-slate-900 group-hover:text-indigo-600 transition-colors">
                    <Link to={`/blog/${post.id}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {post.excerpt}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  Read article <ChevronRight size={16} />
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
