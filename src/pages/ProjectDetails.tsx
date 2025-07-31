import { useParams, Link } from "react-router-dom";
import { dummyProjects } from "@/data/projects";
import { initialComments } from "@/data/comments";
import PortalLayout from "@/components/PortalLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import ProjectComments from "@/components/project-detail/ProjectComments";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = dummyProjects.find((p) => p.id === projectId);
  const comments = initialComments.filter((c) => c.projectId === projectId);

  if (!project) {
    return (
      <PortalLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground">
            The project you are looking for does not exist.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Link>
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "default";
      case "On Hold":
        return "secondary";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight mt-2">
                {project.name}
              </h1>
            </div>
            <div className="flex-shrink-0">
              <p className="text-sm text-muted-foreground">Assigned Team</p>
              <div className="flex items-center -space-x-2 mt-1">
                {project.assignedTo.map((user) => (
                  <Avatar key={user.id} className="border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Start Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {format(parseISO(project.startDate), "dd MMM yyyy")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deadline</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {format(parseISO(project.deadline), "dd MMM yyyy")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(project.budget)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Status
              </CardTitle>
              {project.paymentStatus === "paid" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">
                {project.paymentStatus}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={project.progress} className="w-full" />
              <span className="text-lg font-bold">{project.progress}%</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              </CardContent>
            </Card>
            {project.briefFiles && project.briefFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Brief Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {project.briefFiles.map((file, index) => (
                      <a
                        key={index}
                        href={URL.createObjectURL(file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group border rounded-lg overflow-hidden aspect-square"
                        title={file.name}
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white truncate">
                            {file.name}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {project.services.map((service) => (
                  <Badge key={service} variant="secondary" className="py-1">
                    {service}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <ProjectComments initialComments={comments} />
      </div>
    </PortalLayout>
  );
};

export default ProjectDetails;