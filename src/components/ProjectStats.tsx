import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ListChecks, Loader2, CheckCircle, PauseCircle, Ticket } from "lucide-react";
import { useMemo } from "react";

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

const ProjectStats = ({ projects }: ProjectStatsProps) => {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Total Projects" value={String(stats.totalProjects)} icon={ListChecks} />
      <StatCard title="Total Value" value={stats.totalValue} icon={DollarSign} />
      <StatCard title="In Progress" value={String(stats.inProgress)} icon={Loader2} />
      <StatCard title="Completed" value={String(stats.completed)} icon={CheckCircle} />
      <StatCard title="On Hold" value={String(stats.onHold)} icon={PauseCircle} />
      <StatCard title="Active Tickets" value={String(stats.activeTickets)} icon={Ticket} />
    </div>
  );
};

export default ProjectStats;