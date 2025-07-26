import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { allCollaborators } from '@/data/collaborators';
import { AssignedUser } from '@/data/projects';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collaborator } from '@/types';

interface TeamSelectorProps {
  selectedUsers: AssignedUser[];
  onTeamChange: (users: AssignedUser[]) => void;
}

const TeamSelector = ({ selectedUsers, onTeamChange }: TeamSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (collaborator: Collaborator) => {
    const isSelected = selectedUsers.some(u => u.id === collaborator.id);
    if (isSelected) {
      onTeamChange(selectedUsers.filter(u => u.id !== collaborator.id));
    } else {
      const newUser: AssignedUser = {
        id: collaborator.id,
        name: collaborator.name,
        avatar: collaborator.src || '',
        status: collaborator.online ? 'online' : 'offline',
        src: collaborator.src,
        fallback: collaborator.fallback,
      };
      onTeamChange([...selectedUsers, newUser]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start"
        >
          <div className="flex items-center gap-2 w-full">
            <Users className="h-4 w-4 text-muted-foreground" />
            {selectedUsers.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {selectedUsers.slice(0, 3).map(user => (
                    <Avatar key={user.id} className="h-6 w-6 border-background">
                      <AvatarImage src={user.src} alt={user.name} />
                      <AvatarFallback>{user.fallback}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm font-medium">{selectedUsers.length} member(s) assigned</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Assign team members...</span>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {allCollaborators.map((collaborator) => (
                <CommandItem
                  key={collaborator.id}
                  value={collaborator.name}
                  onSelect={() => handleSelect(collaborator)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={collaborator.src} alt={collaborator.name} />
                      <AvatarFallback>{collaborator.fallback}</AvatarFallback>
                    </Avatar>
                    <span>{collaborator.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedUsers.some(u => u.id === collaborator.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TeamSelector;