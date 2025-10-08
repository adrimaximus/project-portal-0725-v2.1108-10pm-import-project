import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { Label } from "./ui/label";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export default function NewConversationDialog({ isOpen, onClose, onConversationCreated }: NewConversationDialogProps) {
  const { user: currentUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const queryClient = useQueryClient();

  const { data: collaborators = [], isLoading } = useQuery<User[]>({
    queryKey: ['profiles-for-chat'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(p => {
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ');
        return {
          id: p.id,
          name: fullName || p.email || 'Unnamed User',
          avatar_url: getAvatarUrl(p.avatar_url),
          initials: getInitials(fullName, p.email) || 'NN',
          email: p.email,
        };
      }).filter(u => u.id !== currentUser?.id);
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      if (selectedUsers.length === 0) {
        throw new Error("Please select at least one user.");
      }

      const isGroup = selectedUsers.length > 1;
      
      if (isGroup) {
        // Create group conversation
        const { data, error } = await supabase.rpc('create_group_conversation', {
          p_group_name: groupName || selectedUsers.map(u => u.name).join(', '),
          p_participant_ids: selectedUsers.map(u => u.id),
        });
        if (error) throw error;
        return data;
      } else {
        // Create or get 1-on-1 conversation
        const { data, error } = await supabase.rpc('create_or_get_conversation', {
          p_other_user_id: selectedUsers[0].id,
          p_is_group: false,
        });
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (conversationId) => {
      toast.success('Conversation created!');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onConversationCreated(conversationId);
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to create conversation: ${error.message}`);
    },
  });

  const handleSelect = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setGroupName('');
    onClose();
  };

  const selectedUserIds = useMemo(() => new Set(selectedUsers.map(u => u.id)), [selectedUsers]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Select users to start a chat. Select more than one for a group chat.</DialogDescription>
        </DialogHeader>
        
        {selectedUsers.length > 1 && (
          <div className="grid gap-2">
            <Label htmlFor="group-name">Group Name (optional)</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Project Alpha Team"
            />
          </div>
        )}

        <Command>
          <CommandInput placeholder="Search for users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {collaborators.map(collaborator => (
                <CommandItem
                  key={collaborator.id}
                  onSelect={() => handleSelect(collaborator)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={collaborator.avatar_url} />
                      <AvatarFallback style={{ backgroundColor: generatePastelColor(collaborator.id) }}>{collaborator.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{collaborator.name}</p>
                      <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4',
                      selectedUserIds.has(collaborator.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() => createConversationMutation.mutate()}
            disabled={selectedUsers.length === 0 || createConversationMutation.isPending}
          >
            {createConversationMutation.isPending ? 'Creating...' : 'Start Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}