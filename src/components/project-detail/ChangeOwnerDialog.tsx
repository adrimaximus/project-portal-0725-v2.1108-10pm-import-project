import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Project, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { generatePastelColor } from '@/lib/utils';

interface ChangeOwnerDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeOwnerDialog({ project, isOpen, onClose }: ChangeOwnerDialogProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: members } = useQuery<User[]>({
    queryKey: ['project-members-for-owner-change', project.id],
    queryFn: async () => {
      // Fetch all members of the project
      const { data, error } = await supabase
        .from('project_members')
        .select('profiles(*)')
        .eq('project_id', project.id);
      if (error) throw error;
      return data.map((item: any) => {
        const p = item.profiles;
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          name: name || p.email,
          email: p.email,
          avatar_url: p.avatar_url,
          initials: (name ? (name.split(' ')[0][0] + (name.split(' ').length > 1 ? name.split(' ')[1][0] : '')) : p.email[0]).toUpperCase(),
        }
      }).filter(member => member.id !== project.created_by.id); // Exclude current owner
    },
    enabled: isOpen,
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (newOwnerId: string) => {
      const { data, error } = await supabase.rpc('transfer_project_ownership', {
        p_project_id: project.id,
        p_new_owner_id: newOwnerId,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success('Project ownership transferred successfully.');
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to transfer ownership: ${error.message}`);
    },
  });

  const handleTransfer = () => {
    if (selectedUser) {
      transferOwnershipMutation.mutate(selectedUser.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Project Owner</DialogTitle>
          <DialogDescription>
            Select a new owner for this project. The current owner will become a member.
          </DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search for a team member..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {members?.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => setSelectedUser(user)}
                  className={`cursor-pointer ${selectedUser?.id === user.id ? 'bg-accent' : ''}`}
                >
                  <div className="flex items-center">
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p>{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedUser || transferOwnershipMutation.isPending}
          >
            {transferOwnershipMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}