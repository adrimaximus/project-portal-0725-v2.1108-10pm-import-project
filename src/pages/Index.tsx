import { useState, useMemo, useEffect } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import PortalLayout from "@/components/PortalLayout";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyProgressChart from "@/components/dashboard/MonthlyProgressChart";
import UnsplashImage from "@/components/dashboard/UnsplashImage";
import ActivityHubWidget from "@/components/dashboard/ActivityHubWidget";
import TeamPerformanceWidget from "@/components/dashboard/TeamPerformanceWidget";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Index = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const { user, hasPermission } = useAuth();
  const canViewValue = hasPermission('projects:view_value');
  const [viewMode, setViewMode] = useState<'quantity' | 'value'>('quantity');

  useEffect(() => {
    if (!canViewValue) {
      setViewMode('quantity');
    }
  }, [canViewValue]);

  const yearFilter = useMemo(() => {
    if (date?.from && date?.to) {
        if (date.from.getFullYear() === date.to.getFullYear()) {
            return date.from.getFullYear();
        }
    } else if (date?.from) {
        return date.from.getFullYear();
    }
    return null;
  }, [date]);

  const { data, isLoading, hasNextPage, isFetchingNextPage } = useProjects({ 
    year: yearFilter,
  });
  
  const projects = useMemo(() => data?.pages.flatMap(page => page.projects) ?? [], [data]);

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
                <div className="flex items-center gap-2">
                  {canViewValue && (
                    <ToggleGroup 
                      type="single" 
                      value={viewMode} 
                      onValueChange={(value) => { if (value) setViewMode(value as 'quantity' | 'value')}}
                      className="h-10"
                    >
                      <ToggleGroupItem value="quantity" className="text-xs px-3">By Quantity</ToggleGroupItem>
                      <ToggleGroupItem value="value" className="text-xs px-3">By Value</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                  <DateRangePicker date={date} onDateChange={setDate} />
                </div>
            </div>
            <DashboardStatsGrid projects={filteredProjects} viewMode={viewMode} canViewValue={canViewValue} />
            <div className="grid gap-6 md:grid-cols-2">
              <MonthlyProgressChart projects={filteredProjects} />
              <UnsplashImage />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <ActivityHubWidget />
              </div>
              <div className="md:col-span-1">
                <TeamPerformanceWidget projects={filteredProjects} metricType={viewMode} canViewValue={canViewValue} />
              </div>
            </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;