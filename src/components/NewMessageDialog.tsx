import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collaborator } from '@/types';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

const NewMessageDialog = ({ open, onOpenChange, onConversationCreated }: NewMessageDialogProps) => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<Collaborator[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Collaborator[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setGroupName('');
      return;
    }

    const fetchUsers = async () => {
      if (!currentUser) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .neq('id', currentUser.id);

      if (error) {
        toast.error('Gagal memuat daftar pengguna.');
        console.error(error);
        return;
      }

      const collaborators: Collaborator[] = data.map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'No Name',
        email: p.email || '',
        avatar: p.avatar_url || '',
        initials: `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || 'NN',
      }));
      setAllUsers(collaborators);
    };

    fetchUsers();

    const channel: RealtimeChannel = supabase.channel('online-users');
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlineIds = new Set(Object.keys(presenceState));
        setOnlineUserIds(onlineIds);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, currentUser]);

  const handleSelectUser = (user: Collaborator) => {
    setSelectedUsers(prev =>
      prev.some(su => su.id === user.id)
        ? prev.filter(su => su.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0 || !currentUser) return;
    setIsLoading(true);

    try {
      if (selectedUsers.length === 1) {
        // 1-on-1 chat
        const { data: conversationId, error } = await supabase.rpc('create_or_get_conversation', {
          p_other_user_id: selectedUsers[0].id,
          p_is_group: false,
        });

        if (error) throw error;
        onConversationCreated(conversationId);
      } else {
        // Group chat
        if (!groupName.trim()) {
          toast.error('Nama grup tidak boleh kosong.');
          setIsLoading(false);
          return;
        }
        
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({ is_group: true, group_name: groupName })
          .select('id')
          .single();

        if (convError) throw convError;
        if (!newConversation) throw new Error("Gagal membuat percakapan grup.");

        const conversationId = newConversation.id;
        const participants = [{id: currentUser.id}, ...selectedUsers].map(u => ({
          conversation_id: conversationId,
          user_id: u.id,
        }));

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (participantsError) throw participantsError;
        onConversationCreated(conversationId);
      }
    } catch (error: any) {
      toast.error(`Gagal membuat percakapan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const availableUsers = useMemo(() => {
    return allUsers.filter(u => !selectedUsers.some(su => su.id === u.id));
  }, [allUsers, selectedUsers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pesan Baru</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="p-2 border rounded-md min-h-[40px]">
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2 bg-muted p-1 rounded-md text-sm">
                    <span>{user.name}</span>
                    <button onClick={() => handleSelectUser(user)} className="text-muted-foreground hover:text-primary">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground px-1">Pilih satu atau lebih kontak...</p>
            )}
          </div>
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Cari kontak..." />
            <CommandList>
              <CommandEmpty>Tidak ada hasil.</CommandEmpty>
              <CommandGroup>
                {availableUsers.map(user => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelectUser(user)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        {onlineUserIds.has(user.id) && (
                          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                        )}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {selectedUsers.length > 1 && (
            <Input
              placeholder="Nama Grup..."
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleCreateConversation} disabled={isLoading || selectedUsers.length === 0}>
            {isLoading ? 'Membuat...' : 'Mulai Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;