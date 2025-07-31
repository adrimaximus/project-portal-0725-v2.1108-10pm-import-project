import { useState } from 'react';
import { Goal } from '@/data/goals';
import { User, allUsers } from '@/data/users';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, Plus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface GoalCollaborationManagerProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
  onClose: () => void;
}

const GoalCollaborationManager = ({ goal, onUpdate, onClose }: GoalCollaborationManagerProps) => {
  const [collaborators, setCollaborators] = useState<User[]>(goal.collaborators || []);

  const toggleCollaborator = (user: User) => {
    setCollaborators(prev =>
      prev.some(c => c.id === user.id)
        ? prev.filter(c => c.id !== user.id)
        : [...prev, user]
    );
  };

  const handleSaveChanges = () => {
    onUpdate({ ...goal, collaborators });
  };

  const availableUsers = allUsers.filter(u => u.id !== 'user-1'); // Assuming user-1 is the current user

  return (
    <div>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Search users..." />
        <CommandList>
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup>
            {availableUsers.map(user => (
              <CommandItem
                key={user.id}
                onSelect={() => toggleCollaborator(user)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </div>
                {collaborators.some(c => c.id === user.id) ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};

export default GoalCollaborationManager;