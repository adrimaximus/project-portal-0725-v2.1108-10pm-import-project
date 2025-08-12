import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";

const DashboardPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's a quick overview of your projects.
          </p>
        </div>
        <ProjectsTable />
      </div>
    </PortalLayout>
  );
};

export default DashboardPage;