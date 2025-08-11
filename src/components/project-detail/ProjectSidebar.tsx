import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { File as FileIcon } from "lucide-react";

interface ProjectSidebarProps {
  project: Project;
}

const ProjectSidebar = ({ project }: ProjectSidebarProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Assigned To</CardTitle></CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="flex items-center -space-x-2">
              {project.assignedTo.map((user, index) => (
                <Tooltip key={index} delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-card">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                        <AvatarFallback>{user.initials || user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>{user.name}</p></TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Project Files</CardTitle></CardHeader>
        <CardContent>
          {project.briefFiles && project.briefFiles.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {project.briefFiles.map(file => (
                <li key={file.id} className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer truncate">
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No files attached.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSidebar;