import { DollarSign, Package, Users, Activity } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Project } from "@/types/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc("get_dashboard_projects");
  if (error) {
    toast.error("Failed to sync project data.", {
      description: "There was a problem loading project data from the server.",
    });
    console.error(error);
    throw new Error(error.message);
  }
  return data || [];
};

const DashboardSkeleton = () => (
  <div className="space-y-4 pt-2">
    <div className="flex items-center justify-between space-y-2">
      <Skeleton className="h-8 w-48" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Dashboard = () => {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["dashboardProjects"],
    queryFn: fetchProjects,
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <DashboardSkeleton />
      </PortalLayout>
    );
  }

  const totalProjects = projects?.length || 0;
  const totalBudgetValue = projects?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0;
  const activeProjects = projects?.filter(p => p.status === 'In Progress').length || 0;
  const teamMembers = new Set(projects?.flatMap(p => p.assignedTo.map(m => m.id))).size;

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <PortalLayout>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={totalProjects}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
            description={`${activeProjects} active`}
          />
          <StatCard
            title="Total Project Value"
            value={new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(totalBudgetValue)}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description="Sum of all project budgets"
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            description="Projects currently in progress"
          />
          <StatCard
            title="Team Members"
            value={teamMembers}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            description="Unique users across all projects"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentProjects.map((project) => (
                  <Link to={`/projects/${project.id}`} key={project.id} className="flex items-center hover:bg-muted/50 p-2 rounded-lg">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={project.created_by.avatar} alt="Avatar" />
                      <AvatarFallback>{project.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.category}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(project.budget)}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;