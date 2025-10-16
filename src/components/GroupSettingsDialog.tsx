import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collaborator, Conversation } from '@/types';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { Camera, Loader2, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { MultiSelect } from './ui/multi-select';

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
  onUpdate: () => void;
}

const GroupSettingsDialog = ({ open, onOpenChange, conversation, onUpdate }: GroupSettingsDialogProps) => {
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState(conversation.userName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(conversation.userAvatar);
  const [allUsers, setAllUsers] = useState<Collaborator[]>([]);
  const [usersToAdd, setUsersToAdd] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageGroup = currentUser?.id === conversation.created_by || currentUser?.email === 'adri@betterworks.id';

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
        const mappedUsers: Collaborator[] = data.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Unnamed User',
          avatar_url: p.avatar_url,
          initials: `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          email: p.email || '',
        }));
        setAllUsers(mappedUsers);
      }
    };
    fetchUsers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    let newAvatarUrl: string | null = conversation.userAvatar || null;

    if (avatarFile) {
      const sanitizedFileName = avatarFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `group-avatars/${conversation.id}/${Date.now()}-${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, avatarFile);
      if (uploadError) {
        toast.error("Failed to upload group image.");
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
      toast.error("Failed to update group details.", { description: error.message });
    } else {
      toast.success("Group details updated.");
      onUpdate();
    }
    setIsSaving(false);
  };

  const handleAddMembers = async () => {
    if (usersToAdd.length === 0) return;
    setIsSaving(true);
    const { error } = await supabase.rpc('add_group_members', {
      p_conversation_id: conversation.id,
      p_user_ids: usersToAdd,
    });
    if (error) {
      toast.error("Failed to add members.", { description: error.message });
    } else {
      toast.success("Members added successfully.");
      setUsersToAdd([]);
      onUpdate();
    }
    setIsSaving(false);
  };

  const handleRemoveMember = async (userId: string) => {
    const { error } = await supabase.rpc('remove_group_member', {
      p_conversation_id: conversation.id,
      p_user_id_to_remove: userId,
    });
    if (error) {
      toast.error("Failed to remove member.", { description: error.message });
    } else {
      toast.success("Member removed.");
      onUpdate();
    }
  };

  const availableUsersToAdd = allUsers.filter(u => !conversation.members.some(m => m.id === u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-2xl">{conversation.userName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-7 w-7 group-hover:opacity-100 opacity-0 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canManageGroup}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={!canManageGroup} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="group-name">Group Name</Label>
              <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} disabled={!canManageGroup} />
            </div>
          </div>
          <Button onClick={handleSaveDetails} disabled={isSaving || !canManageGroup} size="sm">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold">Members ({conversation.members.length})</h4>
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-4">
                {conversation.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{member.name}</span>
                    </div>
                    {canManageGroup && member.id !== conversation.created_by && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveMember(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {canManageGroup && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold">Add Members</h4>
              <div className="flex gap-2">
                <div className="flex-1">
                  <MultiSelect
                    options={availableUsersToAdd.map(u => ({ value: u.id, label: u.name }))}
                    value={usersToAdd}
                    onChange={setUsersToAdd}
                    placeholder="Select users to add..."
                  />
                </div>
                <Button onClick={handleAddMembers} disabled={isSaving || usersToAdd.length === 0}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettingsDialog;