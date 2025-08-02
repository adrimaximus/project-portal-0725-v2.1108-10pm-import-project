import { useState } from "react";
import { dummyProjects } from "@/data/projects";
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
import { Badge } from "@/components/ui/badge";
import { format, subYears } from "date-fns";
import { getStatusClass, getPaymentStatusClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
import { useUser } from "@/contexts/UserContext";
import PortalLayout from "@/components/PortalLayout";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Index = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const filteredProjects = dummyProjects.filter(project => {
    if (date?.from) {
      const pickerFrom = date.from;
      const pickerTo = date.to || date.from;

      if (!project.startDate || !project.deadline) {
        return false;
      }

      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.deadline);

      if (projectStart > pickerTo || projectEnd < pickerFrom) {
        return false;
      }
    }

    return true;
  });

  const totalValue = filteredProjects.reduce((sum, p) => sum + p.budget, 0);

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
          task.assignedTo.forEach(userId => {
              if (collaboratorStats[userId]) {
                  collaboratorStats[userId].taskCount++;
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
          acc[user.id].totalValue += p.budget;
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
            acc[user.id].pendingValue += p.budget;
        });
        return acc;
    }, {} as Record<string, any>);

  const topUserByPendingValue = Object.values(pendingPaymentCounts).sort((a, b) => b.pendingValue - a.pendingValue)[0] || null;


  return (
    <PortalLayout>
      <div className="space-y-8 p-4 md:p-8">
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
                      <div className="flex items-center gap-4">
                        <CardTitle>Collaborators</CardTitle>
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
                      </div>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
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

        <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
          <div className="border rounded-lg">
            <CollapsibleTrigger className="w-full p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Projects</h2>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="overflow-x-auto">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Project Name</TableHead>
                        <TableHead>Project Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Project Progress</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Project Value</TableHead>
                        <TableHead>Project Due Date</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">Team</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => {
                        const totalTasks = project.tasks?.length || 0;
                        const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
                        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;
                        const ticketCount = project.comments?.filter(comment => (comment as any).isTicket).length || 0;

                        return (
                          <TableRow
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="cursor-pointer"
                          >
                            <TableCell>
                              <div className="font-medium whitespace-nowrap">{project.name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("border-transparent", getStatusClass(project.status))}>
                                {project.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("border-transparent", getPaymentStatusClass(project.paymentStatus))}>
                                {project.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Progress value={progressPercentage} className="w-24" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  {progressPercentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-center">{ticketCount}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium whitespace-nowrap">
                                {'Rp ' + project.budget.toLocaleString('id-ID')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium whitespace-nowrap">
                                {project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {project.assignedTo && project.assignedTo.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-8 w-8 border-2 border-background">
                                      <AvatarImage src={project.assignedTo[0].avatar} alt={project.assignedTo[0].name} />
                                      <AvatarFallback>{project.assignedTo[0].initials}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{project.assignedTo[0].name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end -space-x-2">
                                {project.assignedTo.map((user) => (
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
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </PortalLayout>
  );
};

export default Index;