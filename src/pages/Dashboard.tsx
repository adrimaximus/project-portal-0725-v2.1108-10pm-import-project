import { useState } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import PortalLayout from "@/components/PortalLayout";
import { Project } from "@/data/projects";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import CollaboratorsList from "@/components/dashboard/CollaboratorsList";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const { data: projects = [], isLoading } = useProjects();
  const { user } = useAuth();

  const filteredProjects = projects.filter(project => {
    if (date?.from && project.startDate) {
        const projectStart = new Date(project.startDate);
        const pickerFrom = date.from;
        const pickerTo = date.to || date.from;

        if (project.dueDate) {
            const projectEnd = new Date(project.dueDate);
            return projectStart <= pickerTo && projectEnd >= pickerFrom;
        }
        return projectStart >= pickerFrom && projectStart <= pickerTo;
    }
    return true;
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="space-y-8">
          <div className="text-left">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-3/4 mt-2" />
          </div>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-full md:w-auto lg:w-[300px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hey {user?.name || 'there'}, have a good day! 👋</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Insights</h2>
                <DateRangePicker date={date} onDateChange={setDate} />
            </div>
            <DashboardStatsGrid projects={filteredProjects} />
            <CollaboratorsList projects={filteredProjects} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;