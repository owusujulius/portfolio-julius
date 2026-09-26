import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Github, ArrowRight, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProjects, type Project } from '../../lib/content';

export default function ProjectsGrid({ limit, showViewAll }: { limit?: number; showViewAll?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchProjects({ publishedOnly: true, limit })
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch(() => {
        if (active) setError('Projects are temporarily unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Featured Projects</h2>
          <p className="mt-4 text-lg text-slate-600">
            A selection of my recent work, showcasing engineering excellence and clean design.
          </p>
        </div>
        {showViewAll && (
          <Link to="/projects" className="hidden group items-center text-sm font-semibold text-indigo-600 sm:flex">
            View All Projects
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <p className="text-slate-500">No projects published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl hover:ring-indigo-200"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Code size={48} />
                  </div>
                )}
              </div>
              <div className="flex flex-grow flex-col p-6">
                <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                <p className="mt-2 flex-grow text-sm leading-relaxed text-slate-600 line-clamp-3">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span key={tech} className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center space-x-4 border-t border-slate-100 pt-4">
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600">
                      <ExternalLink size={14} className="mr-1.5" />
                      Live Demo
                    </a>
                  )}
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs font-medium text-slate-600 hover:text-slate-900">
                      <Github size={14} className="mr-1.5" />
                      Source
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
