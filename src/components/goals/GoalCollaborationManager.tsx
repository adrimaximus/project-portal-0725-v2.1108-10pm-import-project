import { useState } from 'react';
import { Goal } from '@/data/goals';
import { User, allUsers } from '@/data/users';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PlusCircle, X } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';

interface GoalCollaborationManagerProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
  onClose: () => void;
}

const GoalCollaborationManager = ({ goal, onUpdate, onClose }: GoalCollaborationManagerProps) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>(goal.collaborators || []);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const availableUsers = allUsers.filter(
    (user) => !selectedUsers.some((selected) => selected.id === user.id)
  );

  const handleSelectUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setPopoverOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  const handleSaveChanges = () => {
    onUpdate({ ...goal, collaborators: selectedUsers });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Current Collaborators</h4>
        <div className="flex flex-wrap items-center gap-2 min-h-[40px]">
          {selectedUsers.length > 0 ? selectedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full pl-2 pr-1 py-1 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.name}</span>
              <button
                onClick={() => handleRemoveUser(user.id)}
                className="rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )) : <p className="text-sm text-muted-foreground">No one else is collaborating on this goal.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Invite new collaborators</h4>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-start">
              <PlusCircle className="mr-2 h-4 w-4" />
              Find user to invite...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
            <Command>
              <CommandInput placeholder="Search by name..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleSelectUser(user)}
                      value={user.name}
                    >
                      <Avatar className="h-6 w-6 mr-2">
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

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </DialogFooter>
    </div>
  );
};

export default GoalCollaborationManager;