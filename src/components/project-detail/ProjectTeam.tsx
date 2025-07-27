import { AssignedUser } from "@/data/projects";
import { allUsers } from "@/data/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectTeamProps {
  assignedTo: AssignedUser[];
  isEditing: boolean;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const ProjectTeam = ({ assignedTo, isEditing, onTeamChange }: ProjectTeamProps) => {
  const handleUserSelection = (user: AssignedUser) => {
    const isSelected = assignedTo.some(u => u.id === user.id);
    if (isSelected) {
      onTeamChange(assignedTo.filter(u => u.id !== user.id));
    } else {
      onTeamChange([...assignedTo, user]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {allUsers.map(user => (
                  <CommandItem key={user.id} onSelect={() => handleUserSelection(user)} className="cursor-pointer">
                    <Checkbox className="mr-2" checked={assignedTo.some(u => u.id === user.id)} />
                    <Avatar className="mr-2 h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assignedTo.map(user => (
              <div key={user.id} className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTeam;