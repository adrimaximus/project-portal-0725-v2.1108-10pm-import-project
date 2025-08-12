import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";

const Dashboard2 = () => {
  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Projects Overview</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">
            A detailed, filterable view of all projects.
          </p>
        </div>
        <ProjectsTable />
      </div>
    </PortalLayout>
  );
};

export default Dashboard2;