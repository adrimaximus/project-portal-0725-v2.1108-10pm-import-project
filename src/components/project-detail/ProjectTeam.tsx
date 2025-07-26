import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectTeamProps {
  project: Project;
}

const ProjectTeam = ({ project }: ProjectTeamProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.assignedTo.map((user) => (
          <div key={user.id} className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.id}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;