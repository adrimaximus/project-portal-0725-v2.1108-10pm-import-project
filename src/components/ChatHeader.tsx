import { Conversation } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import {
  Phone,
  Video,
  MoreVertical,
  Users,
  UserPlus,
  Edit,
  Trash2,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StackedAvatar from "./StackedAvatar";
import { getInitials, generatePastelColor } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";

interface ChatHeaderProps {
  conversation: Conversation;
}

export default function ChatHeader({ conversation }: ChatHeaderProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { id, isGroup, userName, userAvatar, participants, createdBy } = conversation;

  const otherUser = !isGroup ? participants.find(p => p.id !== currentUser?.id) : null;
  const isOwner = isGroup && createdBy === currentUser?.id;

  const leaveGroupMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc('leave_group', { p_conversation_id: conversationId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You have left the group.");
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // You might want to navigate away from the chat here
    },
    onError: (error: any) => {
      toast.error(`Failed to leave group: ${error.message}`);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // This needs a proper backend function with cascading deletes for participants and messages
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Group deleted.");
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete group: ${error.message}`);
    },
  });

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <Avatar className="h-12 w-12 mr-4">
          <AvatarImage src={userAvatar || undefined} alt={userName} />
          <AvatarFallback style={{ backgroundColor: generatePastelColor(otherUser?.id || id) }}>{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{userName}</h2>
          {isGroup ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{participants.length} members</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Online</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone />
        </Button>
        <Button variant="ghost" size="icon">
          <Video />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {isGroup && (
              <>
                {isOwner && (
                  <>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Group</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Add Members</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {!isOwner && isGroup && (
              <DropdownMenuItem onClick={() => leaveGroupMutation.mutate(id)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Leave Group</span>
              </DropdownMenuItem>
            )}
            {isOwner && (
              <DropdownMenuItem className="text-red-500" onClick={() => deleteGroupMutation.mutate(id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Group</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}