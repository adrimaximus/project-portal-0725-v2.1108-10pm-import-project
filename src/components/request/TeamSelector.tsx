import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { allUsers } from '@/data/users';
import { AssignedUser } from '@/data/projects';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSelectorProps {
  selectedUsers: AssignedUser[];
  onTeamChange: (users: AssignedUser[]) => void;
}

const TeamSelector = ({ selectedUsers, onTeamChange }: TeamSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (user: AssignedUser) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      onTeamChange(selectedUsers.filter(u => u.id !== user.id));
    } else {
      onTeamChange([...selectedUsers, user]);
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
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
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
              {allUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => handleSelect(user)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedUsers.some(u => u.id === user.id) ? "opacity-100" : "opacity-0"
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