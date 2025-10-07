import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface ProjectTeamProps {
  project: Project;
}

const ProjectTeam = ({ project }: ProjectTeamProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.assignedTo?.map(member => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={getAvatarUrl(member)} />
                <AvatarFallback style={generatePastelColor(member.id)}>{member.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>
            {member.id === project.created_by.id && (
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Crown className="h-4 w-4" />
                Owner
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;