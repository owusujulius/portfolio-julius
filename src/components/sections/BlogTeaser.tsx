import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/utils';

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  category?: string;
  createdAt: any;
  status: string;
}

export default function BlogTeaser() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const path = 'posts';
      try {
        const q = query(
          collection(db, path),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(data);
      } catch (error) {
        // Fallback for when index isn't ready or other issues
        console.warn("Could not fetch published posts for teaser", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  if (posts.length === 0 && !loading) return null;

  return (
    <section className="bg-slate-900 py-24 sm:py-32 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 opacity-50" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Latest Insights</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Thoughts on software engineering, productivity, and the future of web technology.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {loading ? (
             [1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
            ))
          ) : (
            posts.map((post) => (
              <article key={post.id} className="flex flex-col items-start justify-between rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 transition-all hover:bg-white/10">
                <div className="flex items-center gap-x-4 text-xs font-medium text-indigo-400">
                  <span className="flex items-center gap-1 uppercase tracking-wider">
                    <Calendar size={12} />
                    {formatDate(post.createdAt?.toDate() || new Date())}
                  </span>
                  {post.category && (
                    <span className="relative z-10 rounded-full bg-indigo-400/10 px-3 py-1.5 font-medium text-indigo-400">
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-bold leading-6 text-white group-hover:text-indigo-400 transition-colors">
                    <Link to={`/blog/${post.id}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-300">{post.excerpt}</p>
                </div>
                <div className="mt-8 flex items-center gap-x-4">
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-white">
                      <span className="flex items-center gap-2">
                        <User size={14} className="text-slate-500" />
                        Admin
                      </span>
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            to="/blog"
            className="group flex items-center gap-2 text-sm font-semibold leading-6 text-white hover:text-indigo-400 transition-colors"
          >
            Read more articles
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
