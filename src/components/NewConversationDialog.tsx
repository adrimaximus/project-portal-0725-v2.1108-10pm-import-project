import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Collaborator } from "@/types";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { getInitials } from "@/lib/utils";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartNewChat: (collaborator: Collaborator) => void;
  onStartNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
}

const NewConversationDialog = ({
  open,
  onOpenChange,
  onStartNewChat,
  onStartNewGroupChat,
}: NewConversationDialogProps) => {
  const { user: currentUser } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open || !currentUser) return;

    const fetchCollaborators = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, email')
        .neq('id', currentUser.id);

      if (error) {
        toast.error("Failed to fetch collaborators.");
        return;
      }

      const mappedCollaborators: Collaborator[] = data.map(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          name: fullName || p.email || 'Unnamed User',
          avatar: p.avatar_url,
          initials: getInitials(fullName, p.email) || 'NN',
          email: p.email || '',
          online: false,
        }
      });
      setCollaborators(mappedCollaborators);
    };

    fetchCollaborators();

    const channel = supabase.channel('online-users');
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState<any>();
        const onlineIds = Object.keys(presenceState);
        setOnlineUsers(new Set(onlineIds));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, currentUser]);

  const handleSelectCollaborator = (collaborator: Collaborator, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCollaborators(prev => [...prev, collaborator]);
    } else {
      setSelectedCollaborators(prev => prev.filter(c => c.id !== collaborator.id));
    }
  };

  const handleStartConversation = () => {
    if (selectedCollaborators.length === 0) return;

    if (selectedCollaborators.length === 1) {
      onStartNewChat(selectedCollaborators[0]);
    } else {
      if (!groupName.trim()) {
        toast.error("Please enter a name for the group chat.");
        return;
      }
      onStartNewGroupChat(selectedCollaborators, groupName);
    }
    
    setSelectedCollaborators([]);
    setGroupName("");
    setSearchTerm("");
    onOpenChange(false);
  };

  const filteredCollaborators = collaborators.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGroupChat = selectedCollaborators.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredCollaborators.map(collaborator => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback>{collaborator.initials}</AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${onlineUsers.has(collaborator.id) ? 'bg-green-500' : 'bg-slate-500'}`} />
                    </div>
                    <span className="font-medium">{collaborator.name}</span>
                  </div>
                  <Checkbox
                    checked={selectedCollaborators.some(c => c.id === collaborator.id)}
                    onCheckedChange={(checked) => handleSelectCollaborator(collaborator, !!checked)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          {isGroupChat && (
            <div className="grid gap-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleStartConversation} disabled={selectedCollaborators.length === 0 || (isGroupChat && !groupName.trim())}>
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;