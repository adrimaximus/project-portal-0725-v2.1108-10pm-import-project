import { useParams } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { File, Activity, CreditCard, Wallet, CalendarDays, Ticket } from "lucide-react";
import ProjectComments from "@/components/ProjectComments";

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

  // Dummy data for recent activity
  const recentActivity = [
    {
      id: 1,
      user: {
        name: "Olivia Martin",
        avatar: "https://i.pravatar.cc/150?u=olivia",
      },
      action: "updated the project deadline to December 15, 2024.",
      timestamp: "2024-07-20T10:30:00Z",
    },
    {
      id: 2,
      user: {
        name: "Jackson Lee",
        avatar: "https://i.pravatar.cc/150?u=jackson",
      },
      action: "attached a new file: 'design_mockups_v2.zip'.",
      timestamp: "2024-07-19T15:00:00Z",
    },
    {
      id: 3,
      user: {
        name: project.assignedTo.name,
        avatar: project.assignedTo.avatar,
      },
      action: "changed the project status to 'In Progress'.",
      timestamp: "2024-07-18T09:00:00Z",
    },
  ];

  // Dummy data for support tickets
  const supportTickets = [
    { id: 'TKT-001', title: 'Button color is not updating', status: 'Open' },
    { id: 'TKT-002', title: 'API integration failing on staging', status: 'In Progress' },
    { id: 'TKT-003', title: 'Image upload not working on mobile', status: 'Closed' },
  ];

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

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

  const getTicketStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive";
      case "In Progress":
        return "secondary";
      case "Closed":
        return "default";
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
                {recentActivity.length > 0 ? (
                  <ul className="space-y-6">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                          <AvatarFallback>
                            {activity.user.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <p className="text-sm">
                            <span className="font-semibold">{activity.user.name}</span>
                            {' '}
                            {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatActivityDate(activity.timestamp)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
              </CardContent>
            </Card>

            <ProjectComments />

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

            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {supportTickets.map(ticket => (
                    <li key={ticket.id} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <Ticket className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium hover:underline cursor-pointer">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground">{ticket.id}</p>
                        </div>
                      </div>
                      <Badge variant={getTicketStatusBadgeVariant(ticket.status)} className="whitespace-nowrap">
                        {ticket.status}
                      </Badge>
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

export default ProjectDetail;