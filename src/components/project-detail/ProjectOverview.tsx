import { Project, AssignedUser } from '@/data/projects';
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
      <ProjectTeam team={project.assignedTo} />
      <div className="mt-4">
        <h4 className="font-semibold">Client</h4>
        <p>{project.createdBy.name} ({project.createdBy.email})</p>
      </div>
    </div>
  );
};

export default ProjectOverview;