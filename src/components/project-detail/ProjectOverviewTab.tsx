import { Project } from '@/data/projects';

const ProjectOverviewTab = ({ project }: { project: Project }) => {
  return (
    <div>
      <h3 className="font-bold">Description</h3>
      <p>{project.description}</p>
      <h3 className="font-bold mt-4">Client Email</h3>
      <p>{project.createdBy.email}</p>
    </div>
  );
};

export default ProjectOverviewTab;