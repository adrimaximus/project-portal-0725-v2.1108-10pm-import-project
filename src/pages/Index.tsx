import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange, FilterType } from "@/components/ui/DatePickerWithRange";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { dummyProjects } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const ProjectsPage = () => {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [filterType, setFilterType] = useState<FilterType>("Project Running");

  const filteredProjects = dummyProjects.filter(project => {
    if (!date?.from) return true; // No date filter applied

    const from = new Date(date.from);
    from.setHours(0, 0, 0, 0);
    
    const to = date.to ? new Date(date.to) : new Date(date.from);
    to.setHours(23, 59, 59, 999);

    if (filterType === 'Project Running') {
      const projectStart = new Date(project.startDate);
      const projectDue = new Date(project.deadline);
      // Check for overlap between project duration and selected range
      return projectStart <= to && projectDue >= from;
    }

    if (filterType === 'Payment Due') {
      if (!project.paymentDueDate) return false;
      const paymentDue = new Date(project.paymentDueDate);
      return paymentDue >= from && paymentDue <= to;
    }

    return true;
  });

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex items-center gap-4">
          <DatePickerWithRange 
            date={date} 
            onDateChange={setDate} 
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            className="flex-shrink-0"
          />
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>
      <ProjectsTable columns={columns} data={filteredProjects} />
    </PortalLayout>
  );
};

export default ProjectsPage;