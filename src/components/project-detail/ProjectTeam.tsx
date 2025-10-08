import { Project } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';

interface ProjectTeamProps {
  project: Project;
}

const ProjectTeam = ({ project }: ProjectTeamProps) => {
  return (
    <div className="flex items-center -space-x-2">
      {project.assignedTo?.map(member => (
        <div key={member.id} className="relative group">
          <Avatar>
            <AvatarImage src={getAvatarUrl(member.avatar_url) || undefined} />
            <AvatarFallback style={{ backgroundColor: generatePastelColor(member.id) }}>{member.initials}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {member.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectTeam;