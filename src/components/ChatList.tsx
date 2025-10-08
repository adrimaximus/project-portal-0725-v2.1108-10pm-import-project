import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Conversation } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import NewConversationDialog from "./NewConversationDialog";
import { cn, getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mapToConversation } from "@/lib/chatApi";
import { Plus } from "lucide-react";

interface ChatListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export default function ChatList({ selectedConversationId, onSelectConversation }: ChatListProps) {
  const { user } = useAuth();
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false);

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      return data.map(mapToConversation);
    },
  });

  const handleConversationCreated = (conversationId: string) => {
    onSelectConversation(conversationId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chats</h2>
        <Button size="icon" variant="ghost" onClick={() => setIsNewConversationDialogOpen(true)}>
          <Plus />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          conversations?.map((c) => {
            const otherUser = c.participants.find(p => p.id !== user?.id);
            const avatarSeed = otherUser?.id || c.id;
            const finalAvatarUrl = getAvatarUrl(c.userAvatar || avatarSeed);

            return (
              <div
                key={c.id}
                className={cn(
                  "flex items-center p-3 cursor-pointer hover:bg-muted/50",
                  selectedConversationId === c.id && "bg-muted"
                )}
                onClick={() => onSelectConversation(c.id)}
              >
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={finalAvatarUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: generatePastelColor(otherUser?.id || c.id) }}>{getInitials(c.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between">
                    <p className="font-semibold truncate">{c.userName}</p>
                    {c.lastMessageAt && (
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <NewConversationDialog
        isOpen={isNewConversationDialogOpen}
        onClose={() => setIsNewConversationDialogOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}