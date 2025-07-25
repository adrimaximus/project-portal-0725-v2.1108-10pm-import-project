import * as React from "react";
import { DateRange } from "react-day-picker";
import PortalLayout from "@/components/PortalLayout";
import ProjectsTable, { columns } from "@/components/ProjectsTable";
import { Button } from "@/components/ui/button";
import { dummyProjects } from "@/data/projects";
import { PlusCircle } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Projects = () => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterType, setFilterType] = React.useState<"deadline" | "paymentDueDate">("deadline");

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as "deadline" | "paymentDueDate");
    setDateRange(undefined); // Reset date range when filter type changes
  };

  const filteredProjects = React.useMemo(() => {
    if (!dateRange?.from) {
      return dummyProjects;
    }

    return dummyProjects.filter(project => {
      const projectDateString = project[filterType];
      if (!projectDateString) return false;

      const projectDate = new Date(projectDateString);
      projectDate.setHours(0, 0, 0, 0);

      const from = new Date(dateRange.from!);
      from.setHours(0, 0, 0, 0);

      if (!dateRange.to) {
        return projectDate.getTime() === from.getTime();
      }

      const to = new Date(dateRange.to);
      to.setHours(0, 0, 0, 0);

      return projectDate >= from && projectDate <= to;
    });
  }, [dateRange, filterType]);

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Here's a list of your current projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Select value={filterType} onValueChange={handleFilterTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Project Due Date</SelectItem>
            <SelectItem value="paymentDueDate">Payment Due</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
          placeholder={`Filter by ${filterType === 'deadline' ? 'Project Due Date' : 'Payment Due'}`}
        />
      </div>
      <ProjectsTable columns={columns} data={filteredProjects} />
    </PortalLayout>
  );
};

export default Projects;