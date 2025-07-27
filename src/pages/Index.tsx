import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import PortalLayout from "@/components/PortalLayout";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import { initialComments } from "@/data/comments";
import { PlusCircle } from "lucide-react";
import ProjectStats from "@/components/ProjectStats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Index() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const allAssignees = Array.from(
    new Set(dummyProjects.flatMap((p) => p.assignedTo.map((a) => a.name)))
  );

  const projectsWithTicketCounts = dummyProjects.map(project => {
    const ticketCount = initialComments.filter(comment => 
      comment.projectId === project.id && comment.isTicket
    ).length;
    return { ...project, tickets: ticketCount };
  });

  const filteredProjects = projectsWithTicketCounts
    .filter(project => {
      if (!dateRange || !dateRange.from) {
        const defaultFrom = new Date(new Date().getFullYear(), 0, 1);
        const defaultTo = new Date(new Date().getFullYear(), 11, 31);
        const projectStartDate = new Date(project.startDate);
        return projectStartDate >= defaultFrom && projectStartDate <= defaultTo;
      }
      
      const projectStartDate = new Date(project.startDate);
      const from = dateRange.from;
      const to = dateRange.to;

      if (from && to) {
        return projectStartDate >= from && projectStartDate <= to;
      }
      
      if (from) {
        return projectStartDate >= from;
      }

      return true;
    })
    .filter(project => {
      if (statusFilter === "all") return true;
      return project.status === statusFilter;
    })
    .filter(project => {
      if (assigneeFilter === "all") return true;
      return project.assignedTo.some(a => a.name === assigneeFilter);
    });

  return (
    <PortalLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Here&apos;s a list of your projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/request")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <ProjectStats projects={filteredProjects} statusFilter={statusFilter} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <DatePickerWithRange onDateChange={setDateRange} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Requested">Requested</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Billed">Billed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {allAssignees.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProjectsTable columns={columns} data={filteredProjects} />
    </PortalLayout>
  );
}