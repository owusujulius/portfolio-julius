import { motion } from 'motion/react';
import Hero from '../components/sections/Hero';
import ProjectsGrid from '../components/sections/ProjectsGrid';
import BlogTeaser from '../components/sections/BlogTeaser';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-24 pb-24"
    >
      <Hero />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProjectsGrid limit={3} showViewAll />
      </div>
      <BlogTeaser />
    </motion.div>
  );
}
