import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface NewConversationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

const useProfiles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.filter(p => p.id !== user?.id);
    },
    enabled: !!user,
  });
};

const NewConversationDialog = ({ isOpen, onOpenChange, onConversationCreated }: NewConversationDialogProps) => {
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isGroup = selectedUserIds.length > 1;

  const handleCreateConversation = async () => {
    setIsCreating(true);
    try {
      const rpcName = isGroup ? 'create_group_conversation' : 'create_or_get_conversation';
      const params = isGroup
        ? { p_group_name: groupName, p_participant_ids: selectedUserIds }
        : { p_other_user_id: selectedUserIds[0], p_is_group: false };

      const { data, error } = await supabase.rpc(rpcName, params);

      if (error) throw error;

      onConversationCreated(data);
      onOpenChange(false);
      setSelectedUserIds([]);
      setGroupName('');
    } catch (error: any) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectableUsers = useMemo(() => {
    return profiles.map(p => {
      const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ');
      return {
        id: p.id,
        name: fullName || p.email || 'Unnamed User',
        avatar_url: getAvatarUrl(p),
        initials: getInitials(fullName) || 'NN',
        email: p.email || '',
      };
    });
  }, [profiles]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        {isLoadingProfiles ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <>
            {isGroup && (
              <div className="mb-4">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            )}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectableUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUserIds([...selectedUserIds, user.id]);
                      } else {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <Label htmlFor={`user-${user.id}`} className="flex items-center gap-3 cursor-pointer">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateConversation} disabled={selectedUserIds.length === 0 || (isGroup && !groupName.trim()) || isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;