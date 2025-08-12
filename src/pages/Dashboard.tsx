import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subYears } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ListChecks, CreditCard, User, Users, TrendingUp, Hourglass, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/PortalLayout";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectStatus, PaymentStatus } from "@/data/projects";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardProjectList from "@/components/DashboardProjectList";

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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 9 }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async (isInitialLoad = false) => {
    if (!user) return;
    if (isInitialLoad) setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_dashboard_projects');

      if (error) {
        toast.error("Failed to fetch projects.", {
          id: 'fetch-projects-error',
          description: "There was a problem loading your project data. Please try refreshing the page.",
        });
        console.error(error);
        return;
      }
      
      const mappedProjects: Project[] = data.map((p: any) => ({
        ...p,
        status: p.status as ProjectStatus,
        paymentStatus: p.payment_status as PaymentStatus,
        assignedTo: p.assignedTo || [],
        tasks: p.tasks || [],
        comments: p.comments || [],
        createdBy: p.created_by,
        startDate: p.start_date,
        dueDate: p.due_date,
      }));

      setProjects(mappedProjects);
    } catch (e) {
      toast.error("An unexpected error occurred while fetching projects.", {
        id: 'fetch-projects-error',
      });
      console.error(e);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchProjects(true);

    const handleDbChange = () => {
      toast.info("Project data has been updated.", { duration: 2000 });
      fetchProjects(false);
    };

    const channel = supabase.channel('dashboard-projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleDbChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, handleDbChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleDbChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, handleDbChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProjects]);

  const filteredProjects = projects.filter(project => {
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
  });

  const totalValue = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const projectStatusCounts = filteredProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const paymentStatusCounts = filteredProjects.reduce((acc, p) => {
      acc[p.paymentStatus] = (acc[p.paymentStatus] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const ownerCounts = filteredProjects.reduce((acc, p) => {
      if (p.assignedTo.length > 0) {
          const owner = p.assignedTo[0];
          if (!acc[owner.id]) {
              acc[owner.id] = { ...owner, projectCount: 0 };
          }
          acc[owner.id].projectCount++;
      }
      return acc;
  }, {} as Record<string, any>);

  const topOwner = Object.values(ownerCounts).sort((a, b) => b.projectCount - a.projectCount)[0] || null;

  const collaboratorStats = filteredProjects.reduce((acc, p) => {
      p.assignedTo.forEach(user => {
          if (!acc[user.id]) {
              acc[user.id] = { ...user, projectCount: 0, taskCount: 0 };
          }
          acc[user.id].projectCount++;
      });
      return acc;
  }, {} as Record<string, any>);

  filteredProjects.forEach(p => {
      p.tasks?.forEach(task => {
          (task.assignedTo || []).forEach(user => {
              if (collaboratorStats[user.id]) {
                  collaboratorStats[user.id].taskCount++;
              }
          });
      });
  });

  const collaborators = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount);
  const topCollaborator = collaborators[0] || null;

  const userValueCounts = filteredProjects.reduce((acc, p) => {
      p.assignedTo.forEach(user => {
          if (!acc[user.id]) {
              acc[user.id] = { ...user, totalValue: 0 };
          }
          acc[user.id].totalValue += p.budget || 0;
      });
      return acc;
  }, {} as Record<string, any>);

  const topUserByValue = Object.values(userValueCounts).sort((a, b) => b.totalValue - a.totalValue)[0] || null;

  const pendingPaymentCounts = filteredProjects
    .filter(p => p.paymentStatus === 'Pending')
    .reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) {
                acc[user.id] = { ...user, pendingValue: 0 };
            }
            acc[user.id].pendingValue += p.budget || 0;
        });
        return acc;
    }, {} as Record<string, any>);

  const topUserByPendingValue = Object.values(pendingPaymentCounts).sort((a, b) => b.pendingValue - a.pendingValue)[0] || null;

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Project Value</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{'Rp ' + totalValue.toLocaleString('id-ID')}</div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Project Status</CardTitle>
                          <ListChecks className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="space-y-1 text-sm">
                              {Object.entries(projectStatusCounts).map(([status, count]) => (
                                  <div key={status} className="flex justify-between">
                                      <span>{status}</span>
                                      <span className="font-semibold">{count}</span>
                                  </div>
                              ))}
                          </div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="space-y-1 text-sm">
                              {Object.entries(paymentStatusCounts).map(([status, count]) => (
                                  <div key={status} className="flex justify-between">
                                      <span>{status}</span>
                                      <span className="font-semibold">{count}</span>
                                  </div>
                              ))}
                          </div>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Top Project Owner</CardTitle>
                          <User className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          {topOwner ? (
                              <div className="flex items-center gap-4">
                                  <Avatar>
                                      <AvatarImage src={topOwner.avatar} alt={topOwner.name} />
                                      <AvatarFallback>{topOwner.initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <div className="text-lg font-bold">{topOwner.name}</div>
                                      <p className="text-xs text-muted-foreground">{topOwner.projectCount} projects</p>
                                  </div>
                              </div>
                          ) : (
                              <div>
                                  <div className="text-2xl font-bold">N/A</div>
                                  <p className="text-xs text-muted-foreground">0 projects</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Most Collabs</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          {topCollaborator ? (
                              <div className="flex items-center gap-4">
                                  <Avatar>
                                      <AvatarImage src={topCollaborator.avatar} alt={topCollaborator.name} />
                                      <AvatarFallback>{topCollaborator.initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <div className="text-lg font-bold">{topCollaborator.name}</div>
                                      <p className="text-xs text-muted-foreground">{topCollaborator.projectCount} projects</p>
                                  </div>
                              </div>
                          ) : (
                              <div>
                                  <div className="text-2xl font-bold">N/A</div>
                                  <p className="text-xs text-muted-foreground">0 projects</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Top Contributor</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          {topUserByValue ? (
                              <div className="flex items-center gap-4">
                                  <Avatar>
                                      <AvatarImage src={topUserByValue.avatar} alt={topUserByValue.name} />
                                      <AvatarFallback>{topUserByValue.initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <div className="text-lg font-bold">{topUserByValue.name}</div>
                                      <p className="text-xs text-muted-foreground">
                                          {'Rp ' + topUserByValue.totalValue.toLocaleString('id-ID')}
                                      </p>
                                  </div>
                              </div>
                          ) : (
                              <div>
                                  <div className="text-2xl font-bold">N/A</div>
                                  <p className="text-xs text-muted-foreground">No value</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Most Pending Payment</CardTitle>
                          <Hourglass className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          {topUserByPendingValue ? (
                              <div className="flex items-center gap-4">
                                  <Avatar>
                                      <AvatarImage src={topUserByPendingValue.avatar} alt={topUserByPendingValue.name} />
                                      <AvatarFallback>{topUserByPendingValue.initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <div className="text-lg font-bold">{topUserByPendingValue.name}</div>
                                      <p className="text-xs text-muted-foreground">
                                          {'Rp ' + topUserByPendingValue.pendingValue.toLocaleString('id-ID')}
                                      </p>
                                  </div>
                              </div>
                          ) : (
                              <div>
                                  <div className="text-2xl font-bold">N/A</div>
                                  <p className="text-xs text-muted-foreground">No pending payments</p>
                              </div>
                          )}
                      </CardContent>
                  </Card>
              </div>
              <Card>
                <TooltipProvider>
                  <Collapsible open={isCollaboratorsOpen} onOpenChange={setIsCollaboratorsOpen}>
                    <CollapsibleTrigger className="w-full p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle>Collaborators</CardTitle>
                        <div className="flex items-center gap-4">
                          {!isCollaboratorsOpen && (
                            <div className="flex items-center -space-x-2">
                              {collaborators.slice(0, 5).map(c => (
                                <Tooltip key={c.id}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-8 w-8 border-2 border-card">
                                      <AvatarImage src={c.avatar} alt={c.name} />
                                      <AvatarFallback>{c.initials}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{c.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          )}
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-6 pb-6 pt-0">
                          <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Collaborator</TableHead>
                                        <TableHead className="text-right">Projects</TableHead>
                                        <TableHead className="text-right">Tasks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {collaborators.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={c.avatar} alt={c.name} />
                                                        <AvatarFallback>{c.initials}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium whitespace-nowrap">{c.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{c.projectCount}</TableCell>
                                            <TableCell className="text-right font-medium">{c.taskCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                          </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </TooltipProvider>
              </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DashboardProjectList projects={filteredProjects} />
            </CardContent>
          </Card>
        </div>
      )}
    </PortalLayout>
  );
};

export default Index;