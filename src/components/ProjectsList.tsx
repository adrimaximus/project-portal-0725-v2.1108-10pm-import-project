import { Project } from "@/data/projects";
import { getStatusColor, getStatusBadgeClass } from "@/lib/statusUtils";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface ProjectsListProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => void;
}

const ProjectsList = ({ projects, onDeleteProject }: ProjectsListProps) => {
  return (
    <div className="space-y-4">
      {projects.map(project => (
        <Card key={project.id} className="overflow-hidden">
          <div className="p-4 flex justify-between items-start" style={{ borderLeft: `4px solid ${getStatusColor(project.status)}` }}>
            <div className="flex-grow">
              <Link to={`/projects/${project.id}`} className="font-semibold text-primary hover:underline">
                {project.name}
              </Link>
              <p className="text-sm text-muted-foreground">{project.category}</p>
              <div className="mt-2">
                <Badge variant="outline" className={cn("border-transparent", getStatusBadgeClass(project.status))}>
                  {project.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col items-end ml-4">
              <div className="flex -space-x-2 mb-2">
                {project.assignedTo.map((user) => (
                  <Avatar key={user.id} className="border-2 border-background h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onDeleteProject(project.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Hapus Proyek</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProjectsList;