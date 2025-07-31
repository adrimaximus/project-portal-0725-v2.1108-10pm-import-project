import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects, Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Activity, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(dummyProjects);

  const stats = useMemo(() => {
    const totalRevenue = filteredProjects
      .filter(p => p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + p.budget, 0);

    const pendingPayments = filteredProjects
      .filter(p => ["pending", "on_process", "po_created", "approved", "proposed"].includes(p.paymentStatus))
      .reduce((sum, p) => sum + p.budget, 0);
    
    const activeProjects = filteredProjects.filter(p => p.status === 'In Progress').length;

    const activeTickets = filteredProjects.reduce((sum, p) => sum + (p.tickets || 0), 0);

    return { totalRevenue, pendingPayments, activeProjects, activeTickets };
  }, [filteredProjects]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Based on filtered projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</div>
                 <p className="text-xs text-muted-foreground">Based on filtered projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.activeProjects}</div>
                 <p className="text-xs text-muted-foreground">Currently in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTickets}</div>
                <p className="text-xs text-muted-foreground">Total open tickets</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
            <div className="flex items-center space-x-2">
              <Button onClick={() => navigate('/request')}>+ Add Project</Button>
            </div>
          </div>
          <ProjectsTable columns={columns} data={dummyProjects} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;