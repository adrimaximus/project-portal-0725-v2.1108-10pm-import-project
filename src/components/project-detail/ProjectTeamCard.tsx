import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignedUser } from "@/data/projects";
import { Crown } from "lucide-react";

interface ProjectTeamCardProps {
  team: AssignedUser[];
  creator: AssignedUser;
  isEditing: boolean;
  onTeamChange: (team: AssignedUser[]) => void;
}

const ProjectTeamCard = ({ team, creator }: ProjectTeamCardProps) => {
  const teamMembers = [creator, ...team.filter(u => u.id !== creator.id)];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamMembers.map((user, index) => (
            <li key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
              </div>
              {index === 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Crown className="h-4 w-4" />
                  <span>Creator</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProjectTeamCard;