import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "@/data/projects";

interface ProjectTeamCardProps {
  project: Project;
}

const ProjectTeamCard = ({ project }: ProjectTeamCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {project.assignedTo.map((user) => (
            <div key={user.name} className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTeamCard;