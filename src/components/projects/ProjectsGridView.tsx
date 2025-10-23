import { Project } from '@/types';
import ProjectCard from './ProjectCard';

const ProjectsGridView = ({ projects }: { projects: Project[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-6">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectsGridView;