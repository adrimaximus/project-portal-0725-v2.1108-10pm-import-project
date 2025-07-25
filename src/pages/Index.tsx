import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyProjects } from "@/data/projects";
import { Activity, AlertCircle, Briefcase, Ticket } from "lucide-react";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const totalProjects = dummyProjects.length;
  const inProgressProjects = dummyProjects.filter(p => p.status === 'In Progress').length;
  const overduePayments = dummyProjects.filter(p => p.paymentStatus === 'Overdue').length;
  const openTickets = dummyProjects.reduce((sum, p) => sum + (p.tickets || 0), 0);

  const recentProjects = dummyProjects.slice(0, 5);

  // We need to remove some columns for the dashboard view
  const dashboardColumns = columns.filter(c => 
    c.id !== 'select' && 
    c.id !== 'paymentDueDate' &&
    c.id !== 'tickets' &&
    c.id !== 'budget'
  );

  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">All projects in the system</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects In Progress</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressProjects}</div>
              <p className="text-xs text-muted-foreground">Currently active projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overduePayments}</div>
              <p className="text-xs text-muted-foreground">Projects with payments past due</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Support Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets}</div>
              <p className="text-xs text-muted-foreground">Total unresolved tickets</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Button asChild variant="link" className="pr-0">
              <Link to="/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ProjectsTable columns={dashboardColumns} data={recentProjects} hideFooter />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default DashboardPage;