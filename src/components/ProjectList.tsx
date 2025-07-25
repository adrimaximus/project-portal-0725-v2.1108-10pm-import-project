import { Link } from "react-router-dom";
import { Project } from "@/data/projects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectListProps {
  projects: Project[];
}

const ProjectList = ({ projects }: ProjectListProps) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Budget</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Deadline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link to={`/projects/${project.id}`} className="font-medium hover:underline">
                {project.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {project.status === "In Progress" ? "WIP" : project.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
            <TableCell>
              <div className="flex items-center -space-x-2">
                {project.assignedTo.map((user) => (
                  <Avatar key={user.name} className="h-8 w-8 border-2 border-card">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </TableCell>
            <TableCell>
              {new Date(project.deadline).toLocaleDateString("en-US", {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectList;