import { AssignedUser } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';

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
              <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
              <AvatarFallback style={generatePastelColor(member.id)}>{member.initials}</AvatarFallback>
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