import { dummyProjects } from '@/data/projects';
import PortalLayout from '@/components/PortalLayout';

const ProjectDetails = () => {
  return (
    <PortalLayout>
      <h1>Project Details Page</h1>
      <p>This is a placeholder page. Select a project to see details.</p>
      <p>Known project ID: {dummyProjects[0]?.id}</p>
    </PortalLayout>
  );
};

export default ProjectDetails;