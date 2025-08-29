import { AssignedUser } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ProjectTeamProps {
  team: AssignedUser[];
}

const ProjectTeam = ({ team }: ProjectTeamProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Team</h3>
      <div className="space-y-2">
        {team.map(member => (
          <div key={member.id} className="flex items-center">
            <Avatar>
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <p>{member.name}</p>
              {member.role && <p className="text-sm text-muted-foreground">{member.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTeam;