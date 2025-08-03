import ProjectsTable from "@/components/ProjectsTable";
import PortalLayout from "@/components/PortalLayout";
import { dummyProjects } from "@/data/projects";

const Projects = () => {
  return (
    <PortalLayout>
      <ProjectsTable projects={dummyProjects} />
    </PortalLayout>
  );
};

export default Projects;