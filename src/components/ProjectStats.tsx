import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ListChecks, Ticket } from "lucide-react";
import { useMemo } from "react";

interface ProjectStatsProps {
  projects: Project[];
  statusFilter: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
}

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

const ProjectStats = ({ projects, statusFilter }: ProjectStatsProps) => {
  const stats = useMemo(() => {
    const totalValue = projects.reduce((sum, project) => sum + project.budget, 0);
    const formattedTotalValue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(totalValue);
    
    const activeTickets = projects.reduce((sum, p) => sum + (p.tickets || 0), 0);

    return {
      totalProjects: projects.length,
      totalValue: formattedTotalValue,
      activeTickets,
    };
  }, [projects]);

  const statusDescription = statusFilter === "all" ? "All Statuses" : statusFilter;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard 
        title="Total Projects" 
        value={String(stats.totalProjects)} 
        icon={ListChecks}
        description={statusDescription}
      />
      <StatCard title="Total Value" value={stats.totalValue} icon={DollarSign} />
      <StatCard title="Active Tickets" value={String(stats.activeTickets)} icon={Ticket} />
    </div>
  );
};

export default ProjectStats;