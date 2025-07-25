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
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";

type FilterStatus = Project["status"] | "All Projects";

const Index = () => {
  const projects = dummyProjects;
  const statuses: FilterStatus[] = ["All Projects", "Completed", "In Progress", "On Hold", "Pending"];
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("All Projects");
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const dateFilteredProjects = projects.filter(project => {
    if (!date || !date.from) {
      return true;
    }
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.deadline);
    const rangeStart = date.from;
    const rangeEnd = date.to || new Date(date.from.getTime());
    rangeEnd.setHours(23, 59, 59, 999);

    return projectStart <= rangeEnd && projectEnd >= rangeStart;
  });

  const finalFilteredProjects = selectedStatus === "All Projects"
    ? dateFilteredProjects
    : dateFilteredProjects.filter(p => p.status === selectedStatus);

  const totalProjectsInPeriod = dateFilteredProjects.length;
  const totalTicketsInPeriod = dateFilteredProjects.reduce((acc, project) => acc + (project.tickets || 0), 0);
  
  const statusCount = finalFilteredProjects.length;
  const budgetForStatus = finalFilteredProjects.reduce((acc, project) => acc + project.budget, 0);

  const budgetForStatusFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(budgetForStatus);

  const budgetDescription = selectedStatus === "All Projects" ? "for selected period" : `for ${selectedStatus} projects`;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjectsInPeriod}</div>
              <p className="text-xs text-muted-foreground">in selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget for Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetForStatusFormatted}</div>
              <p className="text-xs text-muted-foreground">{budgetDescription}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as FilterStatus)}
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
                of {totalProjectsInPeriod} projects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTicketsInPeriod}</div>
              <p className="text-xs text-muted-foreground">in selected period</p>
            </CardContent>
          </Card>
        </div>
        <ProjectsTable columns={columns} data={finalFilteredProjects} />
      </div>
    </PortalLayout>
  );
};

export default Index;