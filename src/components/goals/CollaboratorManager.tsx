import { User } from '@/data/users';
import { Goal } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, X, Check } from 'lucide-react';
import { useState } from 'react';

interface CollaboratorManagerProps {
  collaborators: User[] | undefined;
  onUpdateCollaborators: (collaborators: User[]) => void;
  allUsers: User[];
}

const CollaboratorManager = ({ collaborators = [], onUpdateCollaborators, allUsers }: CollaboratorManagerProps) => {
  const [open, setOpen] = useState(false);

  const handleToggleCollaborator = (user: User) => {
    const isCollaborator = collaborators.some(c => c.id === user.id);
    let updatedCollaborators;
    if (isCollaborator) {
      updatedCollaborators = collaborators.filter(c => c.id !== user.id);
    } else {
      updatedCollaborators = [...collaborators, user];
    }
    onUpdateCollaborators(updatedCollaborators);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {collaborators.map(user => (
            <div key={user.id} className="relative group">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => handleToggleCollaborator(user)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64">
              <Command>
                <CommandInput placeholder="Add user..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers.map(user => {
                      const isCollaborator = collaborators.some(c => c.id === user.id);
                      return (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleToggleCollaborator(user)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                          {isCollaborator && <Check className="h-4 w-4 text-primary" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaboratorManager;