import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Folder, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ProjectStatsProps {
  projects: Project[];
}

const ProjectStats = ({ projects }: ProjectStatsProps) => {
  const totalProjects = projects.length;
  const onGoingProjects = projects.filter(
    (p) => p.status === "On Going" || p.status === "In Progress"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "Completed" || p.status === "Done"
  ).length;
  const openTickets = projects.reduce((acc, p) => {
    const projectTickets = p.tickets?.filter(t => t.status === 'Open').length || 0;
    return acc + projectTickets;
  }, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On-going</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onGoingProjects}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedProjects}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openTickets}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStats;