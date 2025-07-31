import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  File as FileIcon,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  List,
  PlusCircle,
} from "lucide-react";
import NotFound from "./NotFound";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | undefined>(undefined);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    setProject(foundProject);
  }, [projectId]);

  if (!project) {
    return (
      <PortalLayout>
        <NotFound />
      </PortalLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const completedTasks = project.tasks.filter((task) => task.completed).length;
  const totalTasks = project.tasks.length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold">{project.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{project.description}</p>
              </div>
              <Badge variant="outline">{project.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{formatDate(project.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-semibold">{formatDate(project.dueDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Project Value</p>
                <p className="font-semibold">{formatCurrency(project.value)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge
                  variant={
                    project.paymentStatus === "paid" ? "default" : "secondary"
                  }
                >
                  {project.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Tasks</p>
                  <p className="text-sm font-medium">
                    {completedTasks}/{totalTasks} Completed
                  </p>
                </div>
                <Progress value={taskProgress} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Brief & Files</CardTitle>
                <Button variant="outline" size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {project.briefFiles.length > 0 ? (
                    project.briefFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-5 h-5" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {file.size}
                        </span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No files uploaded yet.
                    </p>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Project Owner</h4>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={project.owner.avatar} />
                      <AvatarFallback>{project.owner.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.owner.name}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned Team</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.assignedTo.map((user) => (
                      <Avatar key={user.id}>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {project.services.map((service, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{service.name}</span>
                      <span className="font-medium">
                        {formatCurrency(service.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetails;