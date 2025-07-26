import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import PortalLayout from "@/components/PortalLayout";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import { PlusCircle } from "lucide-react";

export default function Index() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredProjects = dummyProjects.filter(project => {
    if (!dateRange || !dateRange.from) {
      // The DatePicker now defaults to a full year.
      // This logic will filter projects based on the selected range.
      // If no range is somehow selected, we show all projects.
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
      // If only 'from' is selected in a range, filter from that date onwards
      return projectStartDate >= from;
    }

    return true;
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <DatePickerWithRange onDateChange={setDateRange} />
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
      <ProjectsTable columns={columns} data={filteredProjects} />
    </PortalLayout>
  );
}