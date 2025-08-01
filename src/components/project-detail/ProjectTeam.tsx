import { User } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectTeamProps {
  team: User[];
  availableTeamMembers: User[];
  isEditing: boolean;
  onTeamChange: (users: User[]) => void;
}

const TeamMemberSelector = ({ allUsers, selectedUsers, onUserSelect }: { allUsers: User[], selectedUsers: User[], onUserSelect: (user: User) => void }) => {
    const selectedUserIds = selectedUsers.map(u => u.id);
    return (
        <Command>
            <CommandInput placeholder="Add team members..." />
            <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                    {allUsers.map((user) => (
                        <CommandItem
                            key={user.id}
                            value={user.name}
                            onSelect={() => onUserSelect(user)}
                            className="cursor-pointer"
                        >
                            <Checkbox
                                className="mr-2"
                                checked={selectedUserIds.includes(user.id)}
                            />
                             <Avatar className="mr-2 h-6 w-6">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.initials || user.name?.slice(0, 2) || '??'}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )
}

const ProjectTeam = ({ team, availableTeamMembers, isEditing, onTeamChange }: ProjectTeamProps) => {
  const handleUserSelect = (user: User) => {
    const isSelected = team.some(u => u.id === user.id);
    const newTeam = isSelected
      ? team.filter(u => u.id !== user.id)
      : [...team, user];
    onTeamChange(newTeam);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Assigned Team</h3>
      <div className="flex items-center -space-x-2">
        {team.map((user) => (
          <TooltipProvider key={user.id} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {isEditing && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative left-2 rounded-full h-12 w-12 bg-background hover:bg-muted border-2 border-dashed">
                <Plus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64">
                <TeamMemberSelector allUsers={availableTeamMembers} selectedUsers={team} onUserSelect={handleUserSelect} />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default ProjectTeam;