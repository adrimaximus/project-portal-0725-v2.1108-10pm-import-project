import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project, ProjectStatus } from "@/data/projects";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProjectsTableProps {
  projects: Project[];
}

const statusStyles: Record<ProjectStatus, string> = {
    "On Track": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    "At Risk": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    "Off Track": "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    "On Hold": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    "Completed": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "Done": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "Billed": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    "Cancelled": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    "In Progress": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    "Requested": "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
};

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead className="text-right">Budget</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link to={`/projects/${project.id}`} className="font-medium hover:underline">{project.name}</Link>
              <div className="text-sm text-muted-foreground">{project.category}</div>
            </TableCell>
            <TableCell>
              <div className="flex -space-x-2">
                {project.assignedTo.map(user => (
                    <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={cn("border-transparent", statusStyles[project.status])}>
                {project.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={project.progress} className="w-24" />
                <span className="text-sm text-muted-foreground">{project.progress}%</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">
                {project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectsTable;