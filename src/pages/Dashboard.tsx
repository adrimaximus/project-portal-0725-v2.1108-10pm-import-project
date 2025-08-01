import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyProjects } from "@/data/projects";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import ProjectsTable from "@/components/ProjectsTable";

const Dashboard = () => {
  const totalBudget = dummyProjects.reduce((acc, project) => acc + project.budget, 0);
  const onTrackProjects = dummyProjects.filter(p => p.status === 'On Track').length;
  const atRiskProjects = dummyProjects.filter(p => p.status === 'At Risk').length;
  const completedProjects = dummyProjects.filter(p => p.status === 'Completed' || p.status === 'Done').length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total budget for all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTrackProjects}</div>
            <p className="text-xs text-muted-foreground">Projects currently on track</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskProjects}</div>
            <p className="text-xs text-muted-foreground">Projects that might miss deadlines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Projects successfully delivered</p>
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Projects</h2>
        <ProjectsTable projects={dummyProjects} />
      </div>
    </div>
  );
};

export default Dashboard;