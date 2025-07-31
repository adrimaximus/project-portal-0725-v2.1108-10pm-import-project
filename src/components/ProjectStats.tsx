import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { DollarSign, ListChecks, CreditCard, MessageSquare } from "lucide-react";

interface ProjectStatsProps {
  projects: Project[];
}

const ProjectStats = ({ projects }: ProjectStatsProps) => {
  const totalValue = projects.reduce((acc, p) => acc + p.budget, 0);
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingPayments = projects.filter(p => p.paymentStatus === 'Pending').length;
  const totalTickets = projects.reduce((acc, p) => acc + (p.tickets?.length || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Project Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{'Rp ' + totalValue.toLocaleString('id-ID')}</div>
          <p className="text-xs text-muted-foreground">from {projects.length} projects</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedProjects}</div>
          <p className="text-xs text-muted-foreground">out of {projects.length} total</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPayments}</div>
          <p className="text-xs text-muted-foreground">projects awaiting payment</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTickets}</div>
          <p className="text-xs text-muted-foreground">active support tickets</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStats;