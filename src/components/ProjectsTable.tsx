import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Ticket } from "lucide-react";

const ProjectsTable = () => {
  const navigate = useNavigate();
  const projects: Project[] = dummyProjects;

  const handleRowClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
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

  const getPaymentStatusBadgeVariant = (
    status: Project["paymentStatus"]
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Projects Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Project Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                onClick={() => handleRowClick(project.id)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={project.assignedTo.avatar}
                        alt={project.assignedTo.name}
                      />
                      <AvatarFallback>
                        {project.assignedTo.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span>{project.assignedTo.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getPaymentStatusBadgeVariant(project.paymentStatus)}
                  >
                    {project.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.tickets && project.tickets.open > 0 ? (
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                      <Ticket className="h-3 w-3" />
                      <span>{project.tickets.open} Open</span>
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(project.budget)}
                </TableCell>
                <TableCell>
                  {new Date(project.deadline).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;