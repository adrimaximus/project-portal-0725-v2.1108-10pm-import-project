import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";

const ProjectsPage = () => {
  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All Projects</h1>
        <p className="text-muted-foreground">
          Manage all your projects from here.
        </p>
      </div>
      <ProjectsTable />
    </PortalLayout>
  );
};

export default ProjectsPage;