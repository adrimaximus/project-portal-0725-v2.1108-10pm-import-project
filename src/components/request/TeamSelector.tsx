import { useState } from 'react';
import { User } from '@/data/users';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dummyUsers } from '@/data/users';

interface TeamSelectorProps {
  selectedUsers: User[];
  onSelectionChange: (users: User[]) => void;
}

const TeamSelector = ({ selectedUsers, onSelectionChange }: TeamSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (currentUser: User) => {
    const newSelection = selectedUsers.some(u => u.id === currentUser.id)
      ? selectedUsers.filter(u => u.id !== currentUser.id)
      : [...selectedUsers, currentUser];
    onSelectionChange(newSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedUsers.length > 0 ? selectedUsers.map(u => u.name).join(', ') : "Select team members..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {dummyUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUsers.some(u => u.id === user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.name}
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