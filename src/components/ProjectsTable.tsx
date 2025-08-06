import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Project } from "@/data/projects";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar as CalendarIcon, Table as TableIcon } from "lucide-react";
import ProjectsCalendar from "./ProjectsCalendar";

interface ProjectsTableProps {
  projects: Project[];
}

const getStatusBadgeClass = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
    case 'On Hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'Off Track':
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'In Progress':
    case 'Requested':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const [view, setView] = useState<'table' | 'calendar'>('table');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Projects</CardTitle>
        <ToggleGroup 
          type="single" 
          value={view} 
          onValueChange={(value) => {
            if (value) setView(value as 'table' | 'calendar');
          }}
          aria-label="View mode"
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <CalendarIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {view === 'table' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link to={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                      {project.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">{project.category}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border-transparent", getStatusBadgeClass(project.status))}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-2" />
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {project.assignedTo.map((user) => (
                        <Avatar key={user.id} className="border-2 border-background">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${project.budget.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ProjectsCalendar projects={projects} />
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;