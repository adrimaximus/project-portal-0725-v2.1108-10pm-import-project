import { Project } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectTeamCardProps {
  project: Project;
}

const ProjectTeamCard = ({ project }: ProjectTeamCardProps) => {
  if (!project.createdBy) {
    return null; // or a loading/placeholder state
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>People assigned to this project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={project.createdBy.avatar_url || undefined} />
                    <AvatarFallback>{project.createdBy.initials || project.createdBy.name?.slice(0, 2) || '??'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{project.createdBy.name}</p>
                    <p className="text-xs text-muted-foreground">Project Owner</p>
                </div>
            </div>
        </div>
        {project.assignedTo.map(member => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>{member.initials || member.name?.slice(0, 2) || '??'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">Team Member</p>
                </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectTeamCard;