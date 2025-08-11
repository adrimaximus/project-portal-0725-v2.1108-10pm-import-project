import { useState, useMemo } from "react";
import { subYears } from "date-fns";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/PortalLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import CollaboratorsCard from "@/components/dashboard/CollaboratorsCard";
import ProjectsDashboardTable from "@/components/dashboard/ProjectsDashboardTable";

const Index = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });
  
  const { projects, isLoading, stats } = useDashboardData();

  const filteredProjects = useMemo(() => projects.filter(project => {
    if (date?.from) {
      const pickerFrom = date.from;
      const pickerTo = date.to || date.from;

      if (!project.startDate || !project.dueDate) {
        return false;
      }

      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.dueDate);

      if (projectStart > pickerTo || projectEnd < pickerFrom) {
        return false;
      }
    }
    return true;
  }), [projects, date]);

  if (!user) {
    return <PortalLayout><div>Please log in to view the dashboard.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hey {user.name}, have a good day! 👋</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        {isLoading && projects.length === 0 ? <DashboardSkeleton /> : (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <h2 className="text-2xl font-bold">Insights</h2>
                  <DateRangePicker date={date} onDateChange={setDate} />
              </div>
              <DashboardStatsGrid {...stats} />
              <CollaboratorsCard collaborators={stats.collaborators} />
              <ProjectsDashboardTable projects={filteredProjects} />
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Index;