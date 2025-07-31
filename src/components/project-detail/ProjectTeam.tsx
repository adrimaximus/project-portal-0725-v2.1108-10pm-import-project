import { User } from '@/data/users';
import { dummyUsers } from '@/data/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface ProjectTeamProps {
  team: User[];
}

const ProjectTeam = ({ team }: ProjectTeamProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Team</CardTitle>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {team.map(member => (
            <div key={member.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">developer</p>
              </div>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;