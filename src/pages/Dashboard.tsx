import { useState, useMemo, useRef, useEffect } from "react";
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
import { format, subYears } from "date-fns";
import { getStatusStyles } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ListChecks, CreditCard, User, Users, TrendingUp, Hourglass, ChevronsUpDown, FolderPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/PortalLayout";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Project, UserProfile } from "@/types";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardProjects } from "../queries/projects";

interface CollaboratorStat extends UserProfile {
  projectCount: number;
  taskCount: number;
  totalValue: number;
  pendingValue: number;
}

const StatCard = ({ title, icon, isLoading, children }: { title: string, icon: React.ReactNode, isLoading: boolean, children: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {isLoading ? <Skeleton className="h-4 w-2/3" /> : <CardTitle className="text-sm font-medium">{title}</CardTitle>}
            {isLoading ? <Skeleton className="h-4 w-4 rounded-full" /> : icon}
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : children}
        </CardContent>
    </Card>
);

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const errorToastShown = useRef(false);

  const { data: projects = [], isLoading, isError } = useQuery<Project[]>({
    queryKey: ['dashboardProjects'],
    queryFn: fetchDashboardProjects,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isError && !errorToastShown.current) {
      toast.error("Gagal mengambil data proyek.");
      errorToastShown.current = true;
    }
  }, [isError]);

  const filteredProjects = useMemo(() => projects.filter(project => {
    if (date?.from) {
      const pickerFrom = date.from;
      const pickerTo = date.to || date.from;
      if (!project.startDate || !project.dueDate) return false;
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.dueDate);
      if (projectStart > pickerTo || projectEnd < pickerFrom) return false;
    }
    return true;
  }), [projects, date]);

  const stats = useMemo(() => {
    const totalValue = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const projectStatusCounts = filteredProjects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const paymentStatusCounts = filteredProjects.reduce((acc, p) => {
        acc[p.paymentStatus] = (acc[p.paymentStatus] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const collaboratorStats = filteredProjects.reduce((acc, p) => {
        p.assignedTo.forEach(user => {
            if (!acc[user.id]) {
                acc[user.id] = { 
                    ...user, 
                    projectCount: 0, 
                    taskCount: 0, 
                    totalValue: 0, 
                    pendingValue: 0 
                };
            }
            acc[user.id].projectCount++;
            acc[user.id].totalValue += p.budget || 0;
            if (p.paymentStatus === 'Pending') acc[user.id].pendingValue += p.budget || 0;
        });
        p.tasks?.forEach(task => (task.assignedTo || []).forEach(user => {
            if (acc[user.id]) {
                if (typeof acc[user.id].taskCount === 'undefined') {
                    acc[user.id].taskCount = 0;
                }
                acc[user.id].taskCount++;
            }
        }));
        return acc;
    }, {} as Record<string, CollaboratorStat>);

    const collaborators: CollaboratorStat[] = Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount);
    const topOwner = collaborators[0] || null;
    const topCollaborator = collaborators[0] || null;
    const topUserByValue = [...collaborators].sort((a, b) => b.totalValue - a.totalValue)[0] || null;
    const topUserByPendingValue = [...collaborators].sort((a, b) => b.pendingValue - a.pendingValue)[0] || null;

    return { totalValue, projectStatusCounts, paymentStatusCounts, topOwner, topCollaborator, topUserByValue, topUserByPendingValue, collaborators };
  }, [filteredProjects]);

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          {authLoading ? (
            <>
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2 mt-2" />
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hey {user?.name || 'there'}, have a good day! 👋</h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
            </>
          )}
        </div>

        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Insights</h2>
                <DateRangePicker date={date} onDateChange={setDate} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Project Value" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    <div className="text-2xl font-bold">{'Rp ' + stats.totalValue.toLocaleString('id-ID')}</div>
                </StatCard>
                <StatCard title="Project Status" icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    <div className="space-y-1 text-sm">{Object.entries(stats.projectStatusCounts).map(([status, count]) => (<div key={status} className="flex justify-between"><span>{status}</span><span className="font-semibold">{count}</span></div>))}</div>
                </StatCard>
                <StatCard title="Payment Status" icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    <div className="space-y-1 text-sm">{Object.entries(stats.paymentStatusCounts).map(([status, count]) => (<div key={status} className="flex justify-between"><span>{status}</span><span className="font-semibold">{count}</span></div>))}</div>
                </StatCard>
                <StatCard title="Top Project Owner" icon={<User className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    {stats.topOwner ? (<div className="flex items-center gap-4"><Avatar><AvatarImage src={stats.topOwner.avatar_url || undefined} alt={stats.topOwner.name} /><AvatarFallback>{stats.topOwner.initials}</AvatarFallback></Avatar><div><div className="text-lg font-bold">{stats.topOwner.name}</div><p className="text-xs text-muted-foreground">{stats.topOwner.projectCount} projects</p></div></div>) : (<div><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">0 projects</p></div>)}
                </StatCard>
                <StatCard title="Most Collabs" icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    {stats.topCollaborator ? (<div className="flex items-center gap-4"><Avatar><AvatarImage src={stats.topCollaborator.avatar_url || undefined} alt={stats.topCollaborator.name} /><AvatarFallback>{stats.topCollaborator.initials}</AvatarFallback></Avatar><div><div className="text-lg font-bold">{stats.topCollaborator.name}</div><p className="text-xs text-muted-foreground">{stats.topCollaborator.projectCount} projects</p></div></div>) : (<div><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">0 projects</p></div>)}
                </StatCard>
                <StatCard title="Top Contributor" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    {stats.topUserByValue ? (<div className="flex items-center gap-4"><Avatar><AvatarImage src={stats.topUserByValue.avatar_url || undefined} alt={stats.topUserByValue.name} /><AvatarFallback>{stats.topUserByValue.initials}</AvatarFallback></Avatar><div><div className="text-lg font-bold">{stats.topUserByValue.name}</div><p className="text-xs text-muted-foreground">{'Rp ' + stats.topUserByValue.totalValue.toLocaleString('id-ID')}</p></div></div>) : (<div><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">No value</p></div>)}
                </StatCard>
                <StatCard title="Most Pending Payment" icon={<Hourglass className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading}>
                    {stats.topUserByPendingValue ? (<div className="flex items-center gap-4"><Avatar><AvatarImage src={stats.topUserByPendingValue.avatar_url || undefined} alt={stats.topUserByPendingValue.name} /><AvatarFallback>{stats.topUserByPendingValue.initials}</AvatarFallback></Avatar><div><div className="text-lg font-bold">{stats.topUserByPendingValue.name}</div><p className="text-xs text-muted-foreground">{'Rp ' + stats.topUserByPendingValue.pendingValue.toLocaleString('id-ID')}</p></div></div>) : (<div><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">No pending payments</p></div>)}
                </StatCard>
            </div>
            <Card>
              <TooltipProvider>
                <Collapsible open={isCollaboratorsOpen} onOpenChange={setIsCollaboratorsOpen}>
                  <CollapsibleTrigger className="w-full p-6"><div className="flex items-center justify-between"><CardTitle>Collaborators</CardTitle><div className="flex items-center gap-4">{!isCollaboratorsOpen && (<div className="flex items-center -space-x-2">{stats.collaborators.slice(0, 5).map(c => (<Tooltip key={c.id}><TooltipTrigger asChild><Avatar className="h-8 w-8 border-2 border-card"><AvatarImage src={c.avatar_url || undefined} alt={c.name} /><AvatarFallback>{c.initials}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{c.name}</p></TooltipContent></Tooltip>))}</div>)}<ChevronsUpDown className="h-4 w-4 text-muted-foreground" /></div></div></CollapsibleTrigger>
                  <CollapsibleContent><CardContent className="px-6 pb-6 pt-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Collaborator</TableHead><TableHead className="text-right">Projects</TableHead><TableHead className="text-right">Tasks</TableHead></TableRow></TableHeader><TableBody>{stats.collaborators.map(c => (<TableRow key={c.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={c.avatar_url || undefined} alt={c.name} /><AvatarFallback>{c.initials}</AvatarFallback></Avatar><span className="font-medium whitespace-nowrap">{c.name}</span></div></TableCell><TableCell className="text-right font-medium">{c.projectCount}</TableCell><TableCell className="text-right font-medium">{c.taskCount}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></CollapsibleContent>
                </Collapsible>
              </TooltipProvider>
            </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="p-0"><div className="overflow-x-auto"><TooltipProvider><Table><TableHeader><TableRow><TableHead className="w-[30%]">Project Name</TableHead><TableHead>Project Status</TableHead><TableHead>Payment Status</TableHead><TableHead>Project Progress</TableHead><TableHead>Tickets</TableHead><TableHead>Project Value</TableHead><TableHead>Project Due Date</TableHead><TableHead>Owner</TableHead><TableHead className="text-right">Team</TableHead></TableRow></TableHeader><TableBody>
            {isLoading && projects.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-24 text-center">Memuat proyek...</TableCell></TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <FolderPlus className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Anda belum memiliki proyek.</p>
                    <Button onClick={() => navigate('/request')}>Buat Proyek Baru</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {const totalTasks = project.tasks?.length || 0; const completedTasks = project.tasks?.filter(t => t.completed).length || 0; const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0); const ticketCount = project.comments?.filter(comment => (comment as any).is_ticket).length || 0; return (<TableRow key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="cursor-pointer"><TableCell style={{ borderLeft: `4px solid ${getStatusStyles(project.status).hex}` }}><div className="font-medium whitespace-nowrap">{project.name}</div></TableCell><TableCell><StatusBadge status={project.status} /></TableCell><TableCell><StatusBadge status={project.paymentStatus} /></TableCell><TableCell><div className="flex items-center gap-3"><Progress value={progressPercentage} className="w-24" /><span className="text-sm font-medium text-muted-foreground">{progressPercentage}%</span></div></TableCell><TableCell><div className="font-medium text-center">{ticketCount}</div></TableCell><TableCell><div className="font-medium whitespace-nowrap">{'Rp ' + (project.budget || 0).toLocaleString('id-ID')}</div></TableCell><TableCell><div className="font-medium whitespace-nowrap">{project.dueDate ? format(new Date(project.dueDate), "MMM dd, yyyy") : 'N/A'}</div></TableCell><TableCell>{project.assignedTo && project.assignedTo.length > 0 && (<Tooltip><TooltipTrigger asChild><Avatar className="h-8 w-8 border-2 border-background"><AvatarImage src={project.assignedTo[0].avatar_url || undefined} alt={project.assignedTo[0].name} /><AvatarFallback>{project.assignedTo[0].initials}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{project.assignedTo[0].name}</p></TooltipContent></Tooltip>)}</TableCell><TableCell><div className="flex items-center justify-end -space-x-2">{project.assignedTo.map((user) => (<Tooltip key={user.id}><TooltipTrigger asChild><Avatar className="h-8 w-8 border-2 border-background"><AvatarImage src={user.avatar_url || undefined} alt={user.name} /><AvatarFallback>{user.initials}</AvatarFallback></Avatar></TooltipTrigger><TooltipContent><p>{user.name}</p></TooltipContent></Tooltip>))}</div></TableCell></TableRow>);})
            )}
          </TableBody></Table></TooltipProvider></div></CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Index;