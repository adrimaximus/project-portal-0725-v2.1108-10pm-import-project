import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ListChecks, Loader2, CheckCircle, PauseCircle, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectStatsProps {
  projects: Project[];
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

type ProjectCountView = "totalProjects" | "inProgress" | "completed" | "onHold";

const ProjectStats = ({ projects }: ProjectStatsProps) => {
  const [projectCountView, setProjectCountView] = useState<ProjectCountView>("totalProjects");

  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, project) => sum + project.budget, 0);
    const formattedTotalValue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(totalValue);

    return {
      totalProjects: projects.length,
      totalValue: formattedTotalValue,
      inProgress: projects.filter(p => p.status === 'In Progress').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      onHold: projects.filter(p => p.status === 'On Hold').length,
      activeTickets: projects.reduce((sum, p) => sum + (p.tickets || 0), 0),
    };
  }, [projects]);

  const projectCountOptions: Record<ProjectCountView, { title: string; icon: React.ElementType; value: number }> = {
    totalProjects: { title: "Total Projects", icon: ListChecks, value: stats.totalProjects },
    inProgress: { title: "In Progress", icon: Loader2, value: stats.inProgress },
    completed: { title: "Completed", icon: CheckCircle, value: stats.completed },
    onHold: { title: "On Hold", icon: PauseCircle, value: stats.onHold },
  };

  const SelectedIcon = projectCountOptions[projectCountView].icon;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <Select value={projectCountView} onValueChange={(value) => setProjectCountView(value as ProjectCountView)}>
            <SelectTrigger className="border-none p-0 h-auto focus:ring-0 focus:ring-offset-0 bg-transparent">
              <SelectValue asChild>
                <CardTitle className="text-sm font-medium cursor-pointer pr-2">
                  {projectCountOptions[projectCountView].title}
                </CardTitle>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalProjects">Total Projects</SelectItem>
              <SelectItem value="inProgress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="onHold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <SelectedIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectCountOptions[projectCountView].value}</div>
        </CardContent>
      </Card>
      
      <StatCard title="Total Value" value={stats.totalValue} icon={DollarSign} />
      <StatCard title="Active Tickets" value={String(stats.activeTickets)} icon={Ticket} />
    </div>
  );
};

export default ProjectStats;