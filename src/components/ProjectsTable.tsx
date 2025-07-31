import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "@/data/projects";
import { useNavigate } from "react-router-dom";
import { Progress } from "./ui/progress";

interface ProjectsTableProps {
  projects: Project[];
}

const getStatusBadgeVariant = (status: Project["status"]): BadgeProps["variant"] => {
  switch (status) {
    case "Completed":
    case "Done":
    case "Billed":
      return "default";
    case "On Track":
      return "success";
    case "On Hold":
    case "At Risk":
      return "secondary"; // Mapped from warning
    case "Cancelled":
    case "Off Track":
      return "destructive";
    case "In Progress":
    case "Requested":
    default:
      return "secondary";
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Team</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-muted-foreground hidden md:block">
                  {project.description}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(project.value)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="w-24" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {project.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end -space-x-2">
                  {project.assignedTo.map((user) => (
                    <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}