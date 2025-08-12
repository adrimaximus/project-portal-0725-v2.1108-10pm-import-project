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
import { Badge } from "@/components/ui/badge";

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
                {Array.from({ length: 7 }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
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
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async (isInitialLoad = false) => {
    if (!user) return;
    if (isInitialLoad) setIsLoading(true);

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        if (isInitialLoad) setIsLoading(false);
        return;
      }

      const projectIds = projectsData.map(p => p.id);

      const [membersRes, tasksRes, commentsRes] = await Promise.all([
        supabase.from('project_members').select('*, profile:profiles(*)').in('project_id', projectIds),
        supabase.from('tasks').select('*, assignedTo:task_assignees(profile:profiles(*))').in('project_id', projectIds),
        supabase.from('comments').select('project_id, is_ticket, id').in('project_id', projectIds),
      ]);

      if (membersRes.error || tasksRes.error || commentsRes.error) {
        console.error("Error fetching project details:", membersRes.error, tasksRes.error, commentsRes.error);
        throw new Error("Failed to fetch project details.");
      }

      const creatorIds = [...new Set(projectsData.map(p => p.created_by).filter(Boolean))];
      const { data: creatorProfilesData, error: creatorError } = await supabase.from('profiles').select('*').in('id', creatorIds);
      if (creatorError) throw creatorError;
      const creatorsMap = new Map(creatorProfilesData.map(p => [p.id, p]));

      const mappedProjects: Project[] = projectsData.map(p => {
        const members = membersRes.data?.filter(m => m.project_id === p.id) || [];
        const tasks = tasksRes.data?.filter(t => t.project_id === p.id) || [];
        const comments = commentsRes.data?.filter(c => c.project_id === p.id) || [];
        const creatorProfile = creatorsMap.get(p.created_by);

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          status: p.status as ProjectStatus,
          progress: p.progress,
          budget: p.budget,
          startDate: p.start_date,
          dueDate: p.due_date,
          paymentStatus: p.payment_status as PaymentStatus,
          createdBy: creatorProfile ? {
              id: creatorProfile.id,
              name: `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || creatorProfile.email,
              email: creatorProfile.email,
              avatar: creatorProfile.avatar_url,
              initials: `${creatorProfile.first_name?.[0] || ''}${creatorProfile.last_name?.[0] || ''}`.toUpperCase(),
          } : null,
          assignedTo: members.map((m: any) => {
              const profile = m.profile;
              return {
                  id: profile.id,
                  name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                  email: profile.email,
                  avatar: profile.avatar_url,
                  initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
                  role: m.role,
              };
          }),
          tasks: tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              assignedTo: (t.assignedTo || []).map((a: any) => {
                  const profile = a.profile;
                  return {
                      id: profile.id,
                      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                      email: profile.email,
                      avatar: profile.avatar_url,
                      initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
                  };
              }),
          })),
          comments: comments.map((c: any) => ({
              id: c.id,
              isTicket: c.is_ticket,
          })),
        } as Project;
      });

      setProjects(mappedProjects);
    } catch (e: any) {
      toast.error("Failed to fetch projects.", {
        id: 'fetch-projects-error',
        description: e.message || "There was a problem loading your project data. Please try refreshing the page.",
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
        return true;
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
              <TooltipProvider>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No projects found for the selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects.map((project) => (
                          <TableRow key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-muted-foreground hidden md:inline">{project.category}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  project.status === 'Completed' ? "border-transparent bg-green-100 text-green-800 hover:bg-green-200" :
                                  project.status === 'In Progress' ? "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200" :
                                  project.status === 'On Hold' ? "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                  project.status === 'Cancelled' ? "border-transparent bg-red-100 text-red-800 hover:bg-red-200" :
                                  "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200"
                                }
                              >
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={project.progress} className="w-20" />
                                <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center -space-x-2">
                                {project.assignedTo.slice(0, 3).map(user => (
                                  <Tooltip key={user.id}>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-8 w-8 border-2 border-background">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.initials}</AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{user.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {project.assignedTo.length > 3 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-8 w-8 border-2 border-background bg-muted-foreground text-background flex items-center justify-center">
                                        <span className="text-xs font-bold">+{project.assignedTo.length - 3}</span>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{project.assignedTo.length - 3} more</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  project.paymentStatus === 'Paid' ? "border-transparent bg-green-100 text-green-800 hover:bg-green-200" :
                                  project.paymentStatus === 'Pending' ? "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                  project.paymentStatus === 'Overdue' ? "border-transparent bg-red-100 text-red-800 hover:bg-red-200" :
                                  "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200"
                                }
                              >
                                {project.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {'Rp ' + (project.budget || 0).toLocaleString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      )}
    </PortalLayout>
  );
};

export default Index;