import { DollarSign, Package, Users, CheckCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ProjectList from "@/components/dashboard/ProjectList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const fetchDashboardProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_dashboard_projects');
  if (error) {
    console.error("Error fetching dashboard projects:", error);
    throw new Error(error.message);
  }
  // The RPC returns a JSON string for created_by, assignedTo, etc.
  // We need to parse it. This is a workaround. A better solution would be to have the RPC return proper JSON objects.
  return (data || []).map(p => ({
    ...p,
    createdBy: typeof p.created_by === 'string' ? JSON.parse(p.created_by) : p.created_by,
    assignedTo: typeof p.assignedTo === 'string' ? JSON.parse(p.assignedTo) : p.assignedTo,
    tasks: typeof p.tasks === 'string' ? JSON.parse(p.tasks) : p.tasks,
    comments: typeof p.comments === 'string' ? JSON.parse(p.comments) : p.comments,
  }));
};

const Dashboard = () => {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['dashboardProjects'],
    queryFn: fetchDashboardProjects,
  });

  if (error) {
    return <div className="p-8">Error fetching projects: {error.message}</div>;
  }

  const activeProjectsCount = isLoading ? 0 : projects?.filter(project =>
    ['Requested', 'In Progress', 'On Hold'].includes(project.status)
  ).length || 0;

  const completedProjectsCount = isLoading ? 0 : projects?.filter(project => project.status === 'Completed').length || 0;

  const totalBudgetValue = isLoading ? 0 : projects?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;

  const uniqueClients = isLoading ? 0 : (projects ? [...new Set(projects.map(p => p.createdBy.email))].length : 0);

  const StatCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Project Value"
        value={new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(totalBudgetValue)}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Active Projects"
        value={activeProjectsCount}
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        description={`${completedProjectsCount} completed`}
      />
      <StatCard
        title="Total Clients"
        value={uniqueClients}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Completed Projects"
        value={completedProjectsCount}
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <StatCards />
          <ProjectList projects={projects || []} />
        </>
      )}
    </div>
  );
};

export default Dashboard;