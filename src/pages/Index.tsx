import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyProjects, Project } from "@/data/projects";
import { DollarSign, Package, Ticket } from "lucide-react";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const projects = dummyProjects;
  const statuses: Project["status"][] = ["Completed", "In Progress", "On Hold", "Pending"];
  const [selectedStatus, setSelectedStatus] = useState<Project["status"]>("Completed");

  const totalProjects = projects.length;
  const totalBudget = projects.reduce((acc, project) => acc + project.budget, 0);
  const totalTickets = projects.reduce((acc, project) => acc + (project.tickets || 0), 0);
  
  const statusCount = projects.filter(p => p.status === selectedStatus).length;

  const budgetFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(totalBudget);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">all-time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetFormatted}</div>
              <p className="text-xs text-muted-foreground">for all projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as Project["status"])}
              >
                <SelectTrigger className="h-auto w-auto p-0 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0 text-muted-foreground hover:text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCount}</div>
              <p className="text-xs text-muted-foreground">
                of {totalProjects} projects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTickets}</div>
              <p className="text-xs text-muted-foreground">across all projects</p>
            </CardContent>
          </Card>
        </div>
        <ProjectsTable columns={columns} data={projects} />
      </div>
    </PortalLayout>
  );
};

export default Index;