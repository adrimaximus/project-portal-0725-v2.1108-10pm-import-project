import { useState, useEffect, useCallback } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/data/projects";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import CollaboratorsList from "@/components/dashboard/CollaboratorsList";

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="text-left">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-6 w-1/2 mt-2" />
    </div>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-full sm:w-auto lg:w-[300px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
      </Card>
    </div>
  </div>
);

const Index = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async (isInitialLoad = false) => {
    if (!user) return;
    if (isInitialLoad) setIsLoading(true);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_projects');

      if (rpcError) {
        console.error("Error calling get_dashboard_projects RPC:", rpcError);
        throw new Error("There was a problem loading project data from the server.");
      }

      if (!rpcData) {
        setProjects([]);
      } else {
        const mappedProjects: Project[] = rpcData.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          status: p.status,
          progress: p.progress,
          budget: p.budget,
          startDate: p.start_date,
          dueDate: p.due_date,
          paymentStatus: p.payment_status,
          createdBy: p.created_by,
          assignedTo: p.assignedTo || [],
          tasks: p.tasks || [],
          comments: p.comments || [],
        }));
        setProjects(mappedProjects);
      }
    } catch (e: any) {
      toast.error("Failed to sync project data.", {
        id: 'fetch-projects-error',
        description: e.message || "Please try refreshing the page.",
      });
      console.error(e);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchProjects(true);

    const handleDbChange = (payload: any) => {
      console.log('Realtime change detected:', payload);
      toast.info("Project data has been updated.", { duration: 2000 });
      fetchProjects(false);
    };

    const channel = supabase.channel('dashboard-projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleDbChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, handleDbChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleDbChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, handleDbChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime channel subscribed for dashboard.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProjects]);

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

  if (!user) {
    return null;
  }

  return (
    <PortalLayout>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hey {user.name}, have a good day! 👋</h1>
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
      )}
    </PortalLayout>
  );
};

export default Index;