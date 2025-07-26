import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ListChecks, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectStatsProps {
  projects: Project[];
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}

type StatusView = "All" | "In Progress" | "Completed" | "On Hold";

const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const ProjectStats = ({ projects }: ProjectStatsProps) => {
  const [statusView, setStatusView] = useState<StatusView>("All");

  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, project) => sum + project.budget, 0);
    const formattedTotalValue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(totalValue);

    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const onHold = projects.filter(p => p.status === 'On Hold').length;
    const activeTickets = projects.reduce((sum, p) => sum + (p.tickets || 0), 0);

    return {
      totalProjects: projects.length,
      totalValue: formattedTotalValue,
      inProgress,
      completed,
      onHold,
      activeTickets,
    };
  }, [projects]);

  const statusDisplay = useMemo(() => {
    switch (statusView) {
      case "In Progress":
        return { value: stats.inProgress, description: "In Progress" };
      case "Completed":
        return { value: stats.completed, description: "Completed" };
      case "On Hold":
        return { value: stats.onHold, description: "On Hold" };
      case "All":
      default:
        return { value: stats.totalProjects, description: "All Projects" };
    }
  }, [statusView, stats]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects by Status</CardTitle>
          <Select value={statusView} onValueChange={(value) => setStatusView(value as StatusView)}>
            <SelectTrigger className="w-[120px] h-8 text-xs focus:ring-0 border-input">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statusDisplay.value}</div>
          <p className="text-xs text-muted-foreground">{statusDisplay.description}</p>
        </CardContent>
      </Card>
      <StatCard title="Total Value" value={stats.totalValue} icon={DollarSign} />
      <StatCard title="Active Tickets" value={String(stats.activeTickets)} icon={Ticket} />
    </div>
  );
};

export default ProjectStats;