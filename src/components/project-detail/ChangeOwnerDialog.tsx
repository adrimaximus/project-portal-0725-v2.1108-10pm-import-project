import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generatePastelColor } from '@/lib/utils';

interface ChangeOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onOwnerChange: (newOwnerId: string) => Promise<void>;
}

const ChangeOwnerDialog = ({ open, onOpenChange, project, onOwnerChange }: ChangeOwnerDialogProps) => {
  const { user: currentUser } = useAuth();
  const [potentialOwners, setPotentialOwners] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser) return;

    const fetchPotentialOwners = async () => {
      setIsLoading(true);
      let query;
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'master admin';

      if (isAdmin) {
        // Admin can transfer to any user except the current owner
        query = supabase.from('profiles').select('*').neq('id', project.created_by.id);
      } else {
        // Owner can only transfer to existing collaborators
        const collaboratorIds = project.assignedTo.map(u => u.id).filter(id => id !== project.created_by.id);
        if (collaboratorIds.length === 0) {
          setPotentialOwners([]);
          setIsLoading(false);
          return;
        }
        query = supabase.from('profiles').select('*').in('id', collaboratorIds);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to fetch users.");
      } else {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar_url: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
        }));
        setPotentialOwners(users);
      }
      setIsLoading(false);
    };

    fetchPotentialOwners();
  }, [open, currentUser, project]);

  const handleSelect = async (newOwnerId: string) => {
    await onOwnerChange(newOwnerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Project Ownership</DialogTitle>
          <DialogDescription>Select a new owner for this project. The current owner will become a member.</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search for a user..." />
          <CommandList>
            {isLoading && <CommandEmpty>Loading users...</CommandEmpty>}
            {!isLoading && potentialOwners.length === 0 && <CommandEmpty>No eligible users to transfer to.</CommandEmpty>}
            <CommandGroup>
              {potentialOwners.map(user => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => handleSelect(user.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeOwnerDialog;