import { Project } from '@/data/projects';

const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold">{project.name}</h2>
      <p>{project.description}</p>
      <hr className="my-4" />
      <div className="mt-4">
        <h4 className="font-semibold">Client</h4>
        <p>{project.createdBy.name} ({project.createdBy.email})</p>
      </div>
    </div>
  );
};

interface ProjectOverviewProps {
  project: Project;
}

export default ProjectOverview;