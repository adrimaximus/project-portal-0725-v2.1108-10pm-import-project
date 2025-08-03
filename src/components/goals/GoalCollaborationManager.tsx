import { useState } from 'react';
import { allUsers, User } from '@/data/users';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCollaborationManagerProps {
  selectedUserIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const GoalCollaborationManager = ({ selectedUserIds, onSelectionChange }: GoalCollaborationManagerProps) => {
  const [open, setOpen] = useState(false);

  const selectedUsers = selectedUserIds
    .map(id => allUsers.find(user => user.id === id))
    .filter((u): u is User => !!u);

  const handleSelect = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-sm mb-2">Collaborators</h4>
        <div className="flex flex-wrap gap-2 items-center">
          {selectedUsers.map(user => (
            <div key={user.id} className="flex items-center gap-2 bg-muted text-sm px-2 py-1 rounded-full">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </div>
          ))}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 rounded-full px-2">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Add collaborators..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers.map(user => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelect(user.id)}
                        className="flex items-center"
                      >
                        <Avatar className="mr-2 h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            selectedUserIds.includes(user.id) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default GoalCollaborationManager;