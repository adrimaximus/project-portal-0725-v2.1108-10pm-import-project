import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";

const DashboardPage = () => {
  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your projects.
        </p>
      </div>
      <ProjectsTable />
    </PortalLayout>
  );
};

export default DashboardPage;