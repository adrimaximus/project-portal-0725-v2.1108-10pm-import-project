import { dummyProjects } from '@/data/projects';
import PortalLayout from '@/components/PortalLayout';
import ProjectsTable from '@/components/ProjectsTable';

const Projects = () => {
  return (
    <PortalLayout>
      <h1>All Projects</h1>
      <ProjectsTable projects={dummyProjects} />
    </PortalLayout>
  );
};

export default Projects;