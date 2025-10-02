import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Collaborator, Conversation } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}

const GroupSettingsDialog = ({ open, onOpenChange, conversation }: GroupSettingsDialogProps) => {
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState(conversation.name);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(conversation.avatar);
  const [allUsers, setAllUsers] = useState<Collaborator[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) console.error('Error fetching users:', error);
      else setAllUsers(data.map(p => ({ ...p, name: `${p.first_name} ${p.last_name}`.trim() || p.email, initials: getInitials(`${p.first_name} ${p.last_name}`.trim() || p.email) })));
    };
    fetchUsers();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let newAvatarUrl: string | null = conversation.avatar || null;

    if (avatarFile) {
      const filePath = `group-avatars/${conversation.id}/${Date.now()}_${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, avatarFile);
      if (uploadError) {
        toast.error('Failed to upload avatar.');
        setIsSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
      newAvatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase.rpc('update_group_details', {
      p_conversation_id: conversation.id,
      p_group_name: groupName,
      p_avatar_url: newAvatarUrl,
    });

    if (error) {
      toast.error('Failed to update group settings.');
    } else {
      toast.success('Group settings updated.');
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  const handleAddMembers = async () => {
    if (selectedUsersToAdd.length === 0) return;
    setIsSaving(true);
    const { error } = await supabase.rpc('add_group_members', {
      p_conversation_id: conversation.id,
      p_user_ids: selectedUsersToAdd,
    });
    if (error) {
      toast.error('Failed to add members.');
    } else {
      toast.success('Members added.');
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedUsersToAdd([]);
      setIsAddingMembers(false);
    }
    setIsSaving(false);
  };

  const handleRemoveMember = async (userId: string) => {
    const { error } = await supabase.rpc('remove_group_member', {
      p_conversation_id: conversation.id,
      p_user_id_to_remove: userId,
    });
    if (error) toast.error('Failed to remove member.');
    else {
      toast.success('Member removed.');
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  };

  const availableUsersToAdd = allUsers.filter(u => !conversation.participants.some(m => m.id === u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-2xl">{conversation.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-6 w-6" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </div>
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" className="text-lg font-semibold" />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold">Members ({conversation.participants.length})</h4>
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-4">
                {conversation.participants.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(member.avatar_url, member.id)} />
                        <AvatarFallback style={generatePastelColor(member.id)}>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                    {member.id !== conversation.created_by && currentUser?.id === conversation.created_by && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveMember(member.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {currentUser?.id === conversation.created_by && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold">Add Members</h4>
              {isAddingMembers ? (
                <div className="space-y-2">
                  <ScrollArea className="h-32 border rounded-md">
                    <div className="p-2">
                      {availableUsersToAdd.map(user => (
                        <div key={user.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted cursor-pointer" onClick={() => {
                          setSelectedUsersToAdd(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]);
                        }}>
                          <div className={`w-4 h-4 border rounded ${selectedUsersToAdd.includes(user.id) ? 'bg-primary' : ''}`} />
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                            <AvatarFallback style={generatePastelColor(user.id)}>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMembers} disabled={isSaving || selectedUsersToAdd.length === 0}>
                      {isSaving ? <Loader2 className="animate-spin" /> : 'Add Selected'}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsAddingMembers(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsAddingMembers(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettingsDialog;