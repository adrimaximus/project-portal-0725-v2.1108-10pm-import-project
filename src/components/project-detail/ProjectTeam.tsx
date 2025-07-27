import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssignedUser } from "@/data/projects";

interface ProjectTeamProps {
  assignedTo: AssignedUser[];
  isEditing: boolean;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const ProjectTeam = ({ assignedTo, isEditing }: ProjectTeamProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      {assignedTo.map(user => (
        <div key={user.id} className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-primary">{user.name}</p>
            <p className="text-xs">{user.role}</p>
          </div>
        </div>
      ))}
      {isEditing && (
        <div className="text-sm text-muted-foreground pt-4">
          Team editing is not fully implemented in this view.
        </div>
      )}
    </div>
  );
};

export default ProjectTeam;