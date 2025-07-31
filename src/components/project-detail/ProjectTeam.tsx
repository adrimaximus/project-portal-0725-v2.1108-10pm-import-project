import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Project, User } from "@/data/projects";
import { UserPlus } from "lucide-react";

interface ProjectTeamProps {
  project: Project;
}

const allUsers: User[] = [
    { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ', role: 'Project Manager' },
    { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob', initials: 'BW', role: 'Lead Developer' },
    { id: 'user-3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'CB', role: 'UX Designer' },
    { id: 'user-4', name: 'Diana Miller', avatar: 'https://i.pravatar.cc/150?u=diana', initials: 'DM', role: 'QA Tester' },
    { id: 'user-5', name: 'Eve Davis', avatar: 'https://i.pravatar.cc/150?u=eve', initials: 'ED', role: 'Backend Developer' },
];

export const ProjectTeam = ({ project }: ProjectTeamProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team</CardTitle>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {project.assignedTo.map(user => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role || 'Member'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};