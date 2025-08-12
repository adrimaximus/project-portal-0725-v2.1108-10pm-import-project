import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";

const ProjectsPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Here's a list of all your projects.
          </p>
        </div>
        <ProjectsTable />
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;