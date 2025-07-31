import { AssignedUser, User } from "@/data/projects";
import { allUsers } from "@/data/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectTeamProps {
  assignedTo: AssignedUser[];
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
}

const ProjectTeam = ({ assignedTo, onTeamChange }: ProjectTeamProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (user: User) => {
    if (!assignedTo.find(u => u.id === user.id)) {
      onTeamChange([...assignedTo, { ...user, role: 'Team Member' }]);
    }
    setOpen(false);
  };

  const handleRemove = (userToRemove: AssignedUser) => {
    onTeamChange(assignedTo.filter(user => user.id !== userToRemove.id));
  };

  const unassignedUsers = allUsers.filter(
    (user) => !assignedTo.some((assignedUser) => assignedUser.id === user.id)
  );

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        {assignedTo.map((user) => (
          <div key={user.id} className="relative group">
            <Tooltip>
              <TooltipTrigger>
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </TooltipContent>
            </Tooltip>
            <button
              onClick={() => handleRemove(user)}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove ${user.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add team member</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-64" align="start">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {unassignedUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleSelect(user)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{user.name}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
};

export default ProjectTeam;