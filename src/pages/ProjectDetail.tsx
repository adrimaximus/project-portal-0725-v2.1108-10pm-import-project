import { useParams } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { File, Activity, CreditCard, Wallet, CalendarDays } from "lucide-react";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = dummyProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">Project not found.</p>
        </div>
      </PortalLayout>
    );
  }

  const getStatusBadgeVariant = (status: Project["status"]) => {
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

  const getPaymentStatusBadgeVariant = (status: Project["paymentStatus"]) => {
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

  const budgetFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(project.budget);

  const deadlineFormatted = new Date(project.deadline).toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>

        {/* Key Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {project.status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={getPaymentStatusBadgeVariant(project.paymentStatus)}>
                {project.paymentStatus}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{budgetFormatted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deadline</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{deadlineFormatted}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={65} className="w-full" />
                  <p className="text-sm text-muted-foreground">65% complete</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={project.assignedTo.avatar} />
                    <AvatarFallback>
                      {project.assignedTo.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{project.assignedTo.name}</p>
                    <p className="text-sm text-muted-foreground">Project Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="hover:underline cursor-pointer">project_brief.pdf</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="hover:underline cursor-pointer">design_mockups.zip</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;