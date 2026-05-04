import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';
import { formatDate } from '../lib/utils';

export default function BlogDetail() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      const path = `posts/${id}`;
      try {
        const docRef = doc(db, 'posts', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setPost(snapshot.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  if (!post) return <div className="text-center py-20"><p>Post not found.</p><Link to="/blog" className="text-indigo-600 underline">Back to blog</Link></div>;

  return (
    <article className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <Link to="/blog" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-12">
        <ArrowLeft size={16} className="mr-2" />
        Back to articles
      </Link>

      <header className="mb-16">
        <div className="flex items-center gap-x-4 text-sm text-slate-500 mb-4">
          <time className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.createdAt?.toDate() || new Date())}
          </time>
          {post.category && (
            <span className="flex items-center gap-1">
              <Tag size={14} />
              {post.category}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{post.title}</h1>
        <div className="mt-8 flex items-center gap-x-3 border-t border-slate-100 pt-8">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Admin</p>
            <p className="text-xs text-slate-500">Portfolio Owner</p>
          </div>
        </div>
      </header>

      <div className="markdown-body prose prose-slate max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-2xl">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
