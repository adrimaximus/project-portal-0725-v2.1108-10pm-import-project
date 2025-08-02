import { useState, useMemo } from "react";
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
import { DollarSign, ListChecks, CreditCard, User, Users, TrendingUp, Hourglass, Package } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import PortalLayout from "@/components/PortalLayout";

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });

  const projectsForUser = useMemo(() => {
    if (user.role === 'Client') {
      // For clients, find projects where they are the creator.
      // This assumes a client 'creates' their own project requests.
      return dummyProjects.filter(p => p.createdBy.id === user.id);
    }
    // Admins and Members see all projects
    return dummyProjects;
  }, [user.role, user.id]);

  const filteredProjects = projectsForUser.filter(project => {
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

  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Admin Insights</h2>
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
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredProjects.length}</div>
              </CardContent>
          </Card>
      </div>
    </div>
  );

  const ClientDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Projects</h2>
      <p className="text-muted-foreground">Here is a list of all your current and past projects.</p>
    </div>
  );

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          <h1 className="text-4xl font-bold tracking-tight">Hey {user.name}, have a good day! 👋</h1>
          <p className="text-xl text-muted-foreground mt-2">
            {user.role === 'Client' ? "Here's what's happening with your projects." : "Here's a quick overview of all projects."}
          </p>
        </div>

        {user.role === 'Admin' || user.role === 'Member' ? <AdminDashboard /> : <ClientDashboard />}

        <TooltipProvider>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Project Name</TableHead>
                  <TableHead>Project Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Project Progress</TableHead>
                  <TableHead>Project Value</TableHead>
                  <TableHead>Project Due Date</TableHead>
                  <TableHead className="text-right">Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const totalTasks = project.tasks?.length || 0;
                  const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
                  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;

                  return (
                    <TableRow
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="font-medium">{project.name}</div>
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
                        <div className="font-medium">
                          {'Rp ' + project.budget.toLocaleString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : 'N/A'}
                        </div>
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
          </div>
        </TooltipProvider>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;