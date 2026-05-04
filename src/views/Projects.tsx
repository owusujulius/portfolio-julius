import ProjectsGrid from '../components/sections/ProjectsGrid';

export default function Projects() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Archive.</h1>
        <p className="mt-4 text-xl text-slate-600">A detailed collection of projects I've built or contributed to.</p>
      </div>
      <ProjectsGrid />
    </div>
  );
}
