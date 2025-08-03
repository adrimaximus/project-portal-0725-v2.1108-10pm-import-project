import { Project } from "@/data/projects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface ProjectsTableProps {
  projects: Project[];
}

const getStatusBadgeVariant = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'success';
    case 'At Risk':
    case 'On Hold':
      return 'warning';
    case 'Off Track':
    case 'Cancelled':
      return 'destructive';
    case 'In Progress':
    case 'Requested':
    default:
      return 'secondary';
  }
};

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link to={`/projects/${project.id}`} className="font-medium text-primary hover:underline">{project.name}</Link>
              <div className="text-sm text-muted-foreground">{project.description.substring(0, 50)}...</div>
            </TableCell>
            <TableCell>{project.owner.name}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
            </TableCell>
            <TableCell>{project.category}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={project.progress} className="w-24" />
                <span>{project.progress}%</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex -space-x-2">
                {project.assignedTo?.slice(0, 3).map((user) => (
                  <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
                {project.assignedTo && project.assignedTo.length > 3 && (
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarFallback>+{project.assignedTo.length - 3}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">${project.budget?.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectsTable;