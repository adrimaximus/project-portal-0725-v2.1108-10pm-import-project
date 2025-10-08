import { Project } from '@/types';
import ProjectTeam from './ProjectTeam';

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold">{project.name}</h2>
      <p>{project.description}</p>
      <hr className="my-4" />
      <ProjectTeam project={project} />
      <div className="mt-4">
        <h4 className="font-semibold">Client</h4>
        <p>{project.created_by?.name} ({project.created_by?.email})</p>
      </div>
    </div>
  );
};

export default ProjectOverview;