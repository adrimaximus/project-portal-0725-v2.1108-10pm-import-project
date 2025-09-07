import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Conversation, Profile } from '@/types';

// Use intersection type to handle inconsistencies in the Conversation type
type DetailedConversation = Conversation & {
  conversation_id: string;
  conversation_name?: string;
  participants?: { id: string }[];
};

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: DetailedConversation;
}

export default function GroupSettingsDialog({ open, onOpenChange, conversation }: GroupSettingsDialogProps) {
  const queryClient = useQueryClient();
  const [usersToAdd, setUsersToAdd] = useState<string[]>([]);

  const { data: allUsers } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const nonMemberOptions: Option[] = useMemo(() => {
    const memberIds = new Set((conversation.participants || []).map(p => p.id));
    return (allUsers || [])
      .filter(user => !memberIds.has(user.id))
      .map(user => ({
        value: user.id,
        label: `${user.first_name} ${user.last_name}`.trim() || user.email || 'Unnamed User',
      }));
  }, [allUsers, conversation.participants]);

  const { mutate: addMembers, isPending } = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { error } = await supabase.rpc('add_group_members', {
        p_conversation_id: conversation.conversation_id,
        p_user_ids: userIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Members added to the group.');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setUsersToAdd([]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to add members: ${error.message}`);
    },
  });

  const handleAddMembers = () => {
    if (usersToAdd.length > 0) {
      addMembers(usersToAdd);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>Manage members of "{conversation.conversation_name}".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Add Members</label>
            <MultiSelect
              options={nonMemberOptions}
              selected={nonMemberOptions.filter(option => usersToAdd.includes(option.value))}
              onChange={(selectedOptions) => setUsersToAdd(selectedOptions.map(option => option.value))}
              placeholder="Select users to add..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddMembers} disabled={isPending || usersToAdd.length === 0}>
            {isPending ? 'Adding...' : 'Add Members'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}