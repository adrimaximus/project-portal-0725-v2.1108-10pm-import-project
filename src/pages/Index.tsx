import PortalLayout from "@/components/PortalLayout";
import ProjectsTable from "@/components/ProjectsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";
import { dummyProjects } from "@/data/projects";

const Index = () => {
  // Calculate the total value of projects with payment status not 'Paid'
  const unpaidProjectsValue = dummyProjects
    .filter((project) => project.paymentStatus !== "Paid")
    .reduce((sum, project) => sum + project.budget, 0);

  // Format the value as IDR currency
  const formattedUnpaidValue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(unpaidProjectsValue);

  // Calculate the total number of open tickets
  const totalOpenTickets = dummyProjects.reduce(
    (sum, project) => sum + (project.tickets?.open || 0),
    0
  );

  // Calculate the number of pending invoices (payment status is not 'Paid')
  const pendingInvoicesCount = dummyProjects.filter(
    (project) => project.paymentStatus !== "Paid"
  ).length;

  // Calculate the number of active projects ('In Progress')
  const activeProjectsCount = dummyProjects.filter(
    (project) => project.status === "In Progress"
  ).length;

  return (
    <PortalLayout>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unpaid Project Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formattedUnpaidValue}</div>
              <p className="text-xs text-muted-foreground">
                Total from pending & overdue projects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{activeProjectsCount}</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Invoices
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{pendingInvoicesCount}</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Support Tickets
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOpenTickets}</div>
              <p className="text-xs text-muted-foreground">
                +2 since last hour
              </p>
            </CardContent>
          </Card>
        </div>
        <ProjectsTable />
      </div>
    </PortalLayout>
  );
};

export default Index;