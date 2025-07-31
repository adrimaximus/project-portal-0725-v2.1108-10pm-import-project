import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, AssignedUser } from '@/data/projects';
import { X } from 'lucide-react';

interface TeamSelectorProps {
  selectedUsers: AssignedUser[];
  onTeamChange: (users: AssignedUser[]) => void;
}

const allUsers: User[] = [
    { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ', role: 'Project Manager' },
    { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob', initials: 'BW', role: 'Lead Developer' },
    { id: 'user-3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'CB', role: 'UX Designer' },
    { id: 'user-4', name: 'Diana Miller', avatar: 'https://i.pravatar.cc/150?u=diana', initials: 'DM', role: 'QA Tester' },
    { id: 'user-5', name: 'Eve Davis', avatar: 'https://i.pravatar.cc/150?u=eve', initials: 'ED', role: 'Backend Developer' },
];

const TeamSelector = ({ selectedUsers, onTeamChange }: TeamSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      onTeamChange([...selectedUsers, user]);
    }
    setOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    onTeamChange(selectedUsers.filter(u => u.id !== userId));
  };

  const availableUsers = allUsers.filter(
    (user) => !selectedUsers.some((selected) => selected.id === user.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
        {selectedUsers.map(user => (
          <div key={user.id} className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-sm">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <span>{user.name}</span>
            <button onClick={() => handleRemoveUser(user.id)} className="rounded-full hover:bg-muted">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-auto">Add Member</Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[250px]" align="start">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.map(user => (
                    <CommandItem key={user.id} onSelect={() => handleSelectUser(user)}>
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
      </div>
    </div>
  );
};

export default TeamSelector;