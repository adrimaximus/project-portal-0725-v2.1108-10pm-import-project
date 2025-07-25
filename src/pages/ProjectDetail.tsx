import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PortalSidebar from "@/components/PortalSidebar";
import PortalHeader from "@/components/PortalHeader";
import { dummyProjects } from "@/data/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const project = dummyProjects.find((p) => p.id === projectId);

  const getStatusBadgeVariant = (
    status: "Completed" | "In Progress" | "On Hold"
  ) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "On Hold":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (
    status: "Paid" | "Pending" | "Overdue"
  ) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Pending":
        return "secondary";
      case "Overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!project) {
    return (
      <div
        className={cn(
          "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
          isSidebarCollapsed
            ? "md:grid-cols-[72px_1fr]"
            : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
        )}
      >
        <PortalSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <div className="flex flex-col">
          <PortalHeader />
          <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6">
            <h1 className="text-2xl font-bold">Project Not Found</h1>
            <p>The project you are looking for does not exist.</p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
              </Link>
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
        isSidebarCollapsed
          ? "md:grid-cols-[72px_1fr]"
          : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
      )}
    >
      <PortalSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div className="flex flex-col">
        <PortalHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              {project.name}
            </h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Project Status
                    </p>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Payment Status
                    </p>
                    <Badge
                      variant={getPaymentStatusBadgeVariant(
                        project.paymentStatus
                      )}
                    >
                      {project.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Budget
                    </p>
                    <p className="font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(project.budget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Deadline
                    </p>
                    <p className="font-semibold">
                      {new Date(project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <img
                  src={project.assignedTo.avatar}
                  alt={project.assignedTo.name}
                  className="h-16 w-16 rounded-full"
                />
                <div>
                  <p className="font-semibold">{project.assignedTo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Project Manager
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;