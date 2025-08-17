import { Project } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface ProjectTeamCardProps {
  project: Project;
}

const ProjectTeamCard = ({ project }: ProjectTeamCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Team</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {project.createdBy && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">PROJECT OWNER</h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={project.createdBy.avatar} />
                <AvatarFallback>{project.createdBy.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{project.createdBy.name}</p>
                <p className="text-xs text-muted-foreground">{project.createdBy.email}</p>
              </div>
            </div>
          </div>
        )}
        {project.assignedTo.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEAM MEMBERS</h4>
            <div className="space-y-3">
              {project.assignedTo.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTeamCard;