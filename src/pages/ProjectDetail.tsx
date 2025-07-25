import { useParams, Link } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import PortalSidebar from "@/components/PortalSidebar";
import PortalHeader from "@/components/PortalHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import ProjectChecklist from "@/components/ProjectChecklist";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = dummyProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <PortalSidebar />
        <div className="flex flex-col">
          <PortalHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Project not found</h1>
              <Link to="/" className="text-primary hover:underline">
                Back to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const progressValue = project.status === "Completed" ? 100 : project.status === "In Progress" ? 66 : 10;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <PortalSidebar />
      <div className="flex flex-col">
        <PortalHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{project.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{project.name}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={project.status.toLowerCase().replace(" ", "")} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="inprogress">In Progress</TabsTrigger>
                        <TabsTrigger value="onhold">On Hold</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assigned To</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="https://i.pravatar.cc/150?u=alma" />
                      <AvatarFallback>AM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">Alma Mahmberg</p>
                      <p className="text-sm text-muted-foreground">Supervisor</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      This project involves a complete redesign of the client's public-facing website. Key objectives include improving user experience, updating the visual design to match new branding guidelines, and migrating to a more robust content management system. The project is currently in the design phase, with development scheduled to begin next month.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="text-sm font-semibold">{progressValue}%</span>
                    </div>
                    <Progress value={progressValue} />
                  </CardContent>
                </Card>
                <ProjectChecklist />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;