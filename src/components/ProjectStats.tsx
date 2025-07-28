import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/data/projects";
import { CheckCircle, ListChecks, AlertCircle } from "lucide-react";

interface ProjectStatsProps {
  project: Project;
}

const ProjectStats = ({ project }: ProjectStatsProps) => {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(task => task.completed).length || 0;
  const openTickets = project.tickets?.filter(ticket => ticket.status === 'Open').length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{project.progress}%</div>
          <Progress value={project.progress} className="mt-2 h-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
          <p className="text-xs text-muted-foreground">Completed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openTickets}</div>
          <p className="text-xs text-muted-foreground">Require attention</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStats;