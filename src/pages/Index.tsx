import { useState, useMemo, useEffect } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import PortalLayout from "@/components/PortalLayout";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import CollaboratorsList from "@/components/dashboard/CollaboratorsList";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyProgressChart from "@/components/dashboard/MonthlyProgressChart";
import UnsplashImage from "@/components/dashboard/UnsplashImage";
import MyTasksWidget from "@/components/dashboard/MyTasksWidget";

const Index = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });

  const yearFilter = useMemo(() => {
    if (date?.from && date?.to) {
        if (date.from.getFullYear() === date.to.getFullYear()) {
            return date.from.getFullYear();
        }
    } else if (date?.from) {
        // If only 'from' is selected, use that year.
        return date.from.getFullYear();
    }
    // If range spans multiple years or is not set, fetch all.
    return null;
  }, [date]);

  const { data, isLoading, hasNextPage, isFetchingNextPage } = useProjects({ 
    fetchAll: true,
    year: yearFilter,
  });
  
  const projects = useMemo(() => data?.pages.flatMap(page => page.projects) ?? [], [data]);
  const { user } = useAuth();

  const filteredProjects = projects.filter(project => {
    if (date?.from && project.start_date) {
        const projectStart = new Date(project.start_date);
        const pickerFrom = date.from;
        const pickerTo = date.to || date.from;

        if (project.due_date) {
            const projectEnd = new Date(project.due_date);
            return projectStart <= pickerTo && projectEnd >= pickerFrom;
        }
        return projectStart >= pickerFrom && projectStart <= pickerTo;
    }
    // If no date range is selected, we still might have a year filter from the hook
    // but for client-side filtering, if there's no date range, we show all fetched projects.
    return true;
  });

  const isStillLoading = isLoading || (hasNextPage && isFetchingNextPage);

  if (isStillLoading && projects.length === 0) {
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
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">Insights</h2>
                </div>
                <DateRangePicker date={date} onDateChange={setDate} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <MonthlyProgressChart projects={filteredProjects} />
              <UnsplashImage />
            </div>
            <MyTasksWidget />
            <DashboardStatsGrid projects={filteredProjects} />
            <CollaboratorsList projects={filteredProjects} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;