import PortalLayout from "@/components/PortalLayout";
import { dummyProjects } from "@/data/projects";
import ProjectsTable from "@/components/ProjectsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Placeholder for stat cards */}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsTable projects={dummyProjects.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;