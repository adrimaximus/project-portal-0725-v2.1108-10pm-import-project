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
import { Button } from "./ui/button";
import { Paperclip } from "lucide-react";

const ProjectsTable = () => {
  const navigate = useNavigate();
  const projects: Project[] = dummyProjects;

  const handleRowClick = (projectId: string) => {
    navigate(`/portal/projects/${projectId}`);
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
        <div className="relative w-full overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Project Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Open Tickets</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Project Due Date</TableHead>
                <TableHead>Payment Due Date</TableHead>
                <TableHead className="text-center">Attachment Invoice</TableHead>
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
                      {project.status === "In Progress" ? "WIP" : project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPaymentStatusBadgeVariant(
                        project.paymentStatus
                      )}
                    >
                      {project.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.tickets && project.tickets.open > 0 ? (
                      <span>{project.tickets.open}</span>
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
                  <TableCell>
                    {project.paymentDueDate ? new Date(project.paymentDueDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {project.invoiceAttachmentUrl ? (
                      <a
                        href={project.invoiceAttachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block"
                      >
                        <Button variant="outline" size="icon">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;