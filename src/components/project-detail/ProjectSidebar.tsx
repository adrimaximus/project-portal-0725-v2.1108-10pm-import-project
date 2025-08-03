import { Project, ProjectFile } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { File } from "lucide-react";

interface ProjectSidebarProps {
  project: Project;
  onUpdateProject: (details: Partial<Project>) => void;
  onUpdateTeam: (newMemberName: string) => void;
  onFileUpload: (files: File[]) => void;
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
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
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
    </div>
  );
};

export default ProjectSidebar;