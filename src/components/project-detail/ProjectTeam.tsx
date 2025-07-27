import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssignedUser } from "@/data/projects";

interface ProjectTeamProps {
  assignedTo: AssignedUser[];
  isEditing: boolean;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const ProjectTeam = ({ assignedTo, isEditing }: ProjectTeamProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {assignedTo.map(user => (
            <div key={user.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
            </div>
          ))}
          {isEditing && (
            <div className="text-sm text-muted-foreground pt-4 border-t">
              Team editing is not fully implemented in this view.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;