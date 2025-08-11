import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { Project, UserProfile } from "@/types";
import { toast } from "sonner";
import AppSkeleton from "@/components/AppSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const getProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_dashboard_projects");

        if (error) {
          console.error("Error fetching dashboard projects:", error);
          toast.error("Failed to load dashboard projects.", {
            description: error.message,
          });
          setProjects([]);
        } else {
          // Manually convert snake_case to camelCase and map avatar to avatar_url
          const formattedData = data.map((p: any) => {
            const createdBy: UserProfile | undefined = p.created_by ? {
              ...p.created_by,
              avatar_url: p.created_by.avatar,
            } : undefined;

            const assignedTo: UserProfile[] = p.assignedTo ? p.assignedTo.map((user: any) => ({
              ...user,
              avatar_url: user.avatar,
            })) : [];

            return {
              ...p,
              dueDate: p.due_date,
              paymentStatus: p.payment_status,
              createdBy: createdBy,
              assignedTo: assignedTo,
            };
          });
          setProjects(formattedData || []);
        }
      } catch (e: any)
{
        console.error("An unexpected error occurred:", e);
        toast.error("An unexpected error occurred.", {
          description: e.message,
        });
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    getProjects();
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "on hold":
        return <Badge variant="secondary">On Hold</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <AppSkeleton />;
  }

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's a summary of your projects.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-semibold">Your Projects</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto lg:w-[300px]"
              />
              <Link to="/request">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter((p) => p.status === "In Progress").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter((p) => p.status === "Completed").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {projects
                    .reduce((acc, p) => acc + (p.budget || 0), 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projects Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={project.progress}
                              className="w-24"
                            />
                            <span>{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {project.assignedTo?.slice(0, 3).map((user) => (
                              <Avatar
                                key={user.id}
                                className="h-8 w-8 border-2 border-background"
                              >
                                <AvatarImage
                                  src={user.avatar_url}
                                  alt={user.name}
                                />
                                <AvatarFallback>{user.initials}</AvatarFallback>
                              </Avatar>
                            ))}
                            {project.assignedTo?.length > 3 && (
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarFallback>
                                  +{project.assignedTo.length - 3}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.dueDate
                            ? format(new Date(project.dueDate), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          ${project.budget?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(project.paymentStatus)}
                        </TableCell>
                        <TableCell>{project.tasks?.length || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={project.createdBy?.avatar_url}
                                alt={project.createdBy?.name}
                              />
                              <AvatarFallback>
                                {project.createdBy?.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span>{project.createdBy?.name}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No projects found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default DashboardPage;