import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Goal, User } from '@/types';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { X, Plus, Crown, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from '../ui/input';
import { getInitials, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface GoalCollaborationManagerProps {
  goal: Goal;
}

const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        return {
          id: profile.id,
          name: fullName || profile.email || 'No name',
          avatar_url: profile.avatar_url,
          email: profile.email,
          initials: getInitials(fullName) || 'NN',
        } as User;
      });
    },
  });
};

const GoalCollaborationManager = ({ goal }: GoalCollaborationManagerProps) => {
  const queryClient = useQueryClient();
  const { data: allUsers = [] } = useProfiles();
  const [open, setOpen] = useState(false);

  const { mutate: updateCollaborators, isPending } = useMutation({
    mutationFn: async (newCollaboratorIds: string[]) => {
      const currentCollaboratorIds = goal.collaborators?.map(c => c.id) || [];
      
      const toAdd = newCollaboratorIds.filter(id => !currentCollaboratorIds.includes(id));
      const toRemove = currentCollaboratorIds.filter(id => !newCollaboratorIds.includes(id) && id !== goal.user_id);

      if (toAdd.length > 0) {
        const { error } = await supabase.from('goal_collaborators').insert(toAdd.map(id => ({ goal_id: goal.id, user_id: id })));
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase.from('goal_collaborators').delete().eq('goal_id', goal.id).in('user_id', toRemove);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Collaborators updated");
      queryClient.invalidateQueries({ queryKey: ['goal', goal.slug] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSelect = (userId: string) => {
    const currentIds = goal.collaborators?.map(c => c.id) || [];
    if (!currentIds.includes(userId)) {
      updateCollaborators([...currentIds, userId]);
    }
  };

  const handleRemove = (userId: string) => {
    if (userId === goal.user_id) return;
    const currentIds = goal.collaborators?.map(c => c.id) || [];
    updateCollaborators(currentIds.filter(id => id !== userId));
  };

  const availableUsers = useMemo(() => {
    const collaboratorIds = goal.collaborators?.map(c => c.id) || [];
    return allUsers.filter(u => !collaboratorIds.includes(u.id));
  }, [allUsers, goal.collaborators]);

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Collaborators</h4>
      <div className="flex flex-wrap gap-2 items-center">
        {goal.collaborators?.map(user => (
          <div key={user.id} className="flex items-center gap-2 bg-muted p-1 pr-2 rounded-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={getAvatarUrl(user)} />
              <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.name}</span>
            {user.id === goal.user_id ? (
              <Crown className="h-4 w-4 text-yellow-500" />
            ) : (
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => handleRemove(user.id)} disabled={isPending}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[250px]">
            <Command>
              <CommandInput placeholder="Search user..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.map(user => (
                    <CommandItem key={user.id} onSelect={() => handleSelect(user.id)} value={user.name}>
                       <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                            <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
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
    </div>
  );
};

export default GoalCollaborationManager;