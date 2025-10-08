import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Goal, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Crown, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import { getInitials, generatePastelColor, getAvatarUrl } from '@/lib/utils';

interface GoalCollaborationManagerProps {
  goal: Goal;
}

export function GoalCollaborationManager({ goal }: GoalCollaborationManagerProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newOwner, setNewOwner] = useState<User | null>(null);

  const isOwner = currentUser?.id === goal.user_id;

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['all-users-for-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(p => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          name: name || p.email,
          avatar_url: p.avatar_url,
          initials: (name ? (name.split(' ')[0][0] + (name.split(' ').length > 1 ? name.split(' ')[1][0] : '')) : p.email[0]).toUpperCase(),
          email: p.email,
        };
      });
    },
  });

  const addCollaboratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('goal_collaborators').insert({
        goal_id: goal.id,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goal.slug] });
      toast.success('Collaborator added.');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('goal_collaborators').delete()
        .eq('goal_id', goal.id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goal.slug] });
      toast.success('Collaborator removed.');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (newOwnerId: string) => {
      const { data, error } = await supabase.rpc('transfer_goal_ownership', {
        p_goal_id: goal.id,
        p_new_owner_id: newOwnerId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goal.slug] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Ownership transferred.');
      setNewOwner(null);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const availableUsers = allUsers?.filter(u => 
    u.id !== goal.user_id && !goal.collaborators.some(c => c.id === u.id)
  ) || [];

  return (
    <div>
      <h4 className="font-semibold mb-3">Collaborators</h4>
      <div className="space-y-3">
        {/* Owner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={getAvatarUrl(goal.collaborators.find(c => c.id === goal.user_id)?.avatar_url) || undefined} />
              <AvatarFallback style={{ backgroundColor: generatePastelColor(goal.user_id) }}>{goal.collaborators.find(c => c.id === goal.user_id)?.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{goal.collaborators.find(c => c.id === goal.user_id)?.name}</p>
              <p className="text-xs text-muted-foreground">{goal.collaborators.find(c => c.id === goal.user_id)?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            <Crown className="h-4 w-4" />
            <span>Owner</span>
          </div>
        </div>

        {/* Other Collaborators */}
        {goal.collaborators.filter(c => c.id !== goal.user_id).map(user => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={() => removeCollaboratorMutation.mutate(user.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="mt-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" /> Add Collaborator
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {availableUsers.map(user => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          addCollaboratorMutation.mutate(user.id);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} alt={user.name} />
                            <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}