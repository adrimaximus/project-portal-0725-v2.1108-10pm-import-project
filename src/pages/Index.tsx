import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { useProjects } from "@/contexts/ProjectContext";

const Index = () => {
  const { projects } = useProjects();

  return (
    <PortalLayout pageTitle="Projects Overview" pageHeader={null}>
      <div className="space-y-6">
        <ProjectsTable projects={projects} />
      </div>
    </PortalLayout>
  );
};

export default Index;