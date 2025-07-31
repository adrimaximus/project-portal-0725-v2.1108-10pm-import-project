import { AssignedUser } from '@/data/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, X } from 'lucide-react';

interface ProjectTeamProps {
  assignedTo: AssignedUser[];
  onTeamChange: (team: AssignedUser[]) => void;
}

const ProjectTeam = ({ assignedTo, onTeamChange }: ProjectTeamProps) => {
  // Dummy function, in a real app this would open a user selection modal
  const handleAddMember = () => {
    console.log("Add member clicked");
  };

  const handleRemoveMember = (userId: string) => {
    onTeamChange(assignedTo.filter(user => user.id !== userId));
  };

  return (
    <div className="space-y-3">
      {assignedTo.map(member => (
        <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveMember(member.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={handleAddMember}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Team Member
      </Button>
    </div>
  );
};

export default ProjectTeam;