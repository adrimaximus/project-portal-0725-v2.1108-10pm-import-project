import { User } from "@/data/projects";
import { allUsers } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectTeamProps {
  assignedTo: User[];
  createdBy: User;
  isEditing: boolean;
  onTeamChange: (selectedUsers: User[]) => void;
}

const TeamMember = ({ user }: { user: User }) => (
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>{user.initials || user.name.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-medium">{user.name}</p>
      <p className="text-sm text-muted-foreground">{user.role || 'Team Member'}</p>
    </div>
  </div>
);

const ProjectTeam = ({ assignedTo, createdBy, isEditing, onTeamChange }: ProjectTeamProps) => {
  const handleSelectionChange = (user: User) => {
    const isSelected = assignedTo.some(u => u.id === user.id);
    if (isSelected) {
      onTeamChange(assignedTo.filter(u => u.id !== user.id));
    } else {
      onTeamChange([...assignedTo, user]);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team</CardTitle>
        {isEditing && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add/Remove
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Find user..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers.map(user => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelectionChange(user)}
                        className="cursor-pointer"
                      >
                        <Checkbox
                          className="mr-2"
                          checked={assignedTo.some(u => u.id === user.id)}
                        />
                        <Avatar className="mr-2 h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Project Lead</h4>
          <TeamMember user={createdBy} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Assigned Team</h4>
          <div className="space-y-3">
            {assignedTo.map(user => (
              <TeamMember key={user.id} user={user} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;