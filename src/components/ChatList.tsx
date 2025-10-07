import { useState } from "react";
import { Conversation } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import NewConversationDialog from "./NewConversationDialog";
import { cn, getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { Plus } from "lucide-react";
import { Button } from "./ui/button";

interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

const ChatList = ({ conversations, selectedConversationId, onSelectConversation }: ChatListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button size="sm" onClick={() => setIsNewConversationDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
        <Input
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredConversations.map(c => {
          const otherUser = c.participants.find(p => p.id === c.otherUserId);
          const avatarSeed = otherUser?.id || c.id;
          const finalAvatarUrl = getAvatarUrl({ avatar_url: c.userAvatar, id: avatarSeed });

          return (
            <div
              key={c.id}
              className={cn(
                "flex items-center p-3 cursor-pointer hover:bg-muted/50",
                { "bg-muted": selectedConversationId === c.id }
              )}
              onClick={() => onSelectConversation(c.id)}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={finalAvatarUrl} />
                <AvatarFallback style={generatePastelColor(avatarSeed)}>
                  {getInitials(c.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(c.lastMessageAt, { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
      <NewConversationDialog
        isOpen={isNewConversationDialogOpen}
        onOpenChange={setIsNewConversationDialogOpen}
        onConversationCreated={(conversationId) => {
          onSelectConversation(conversationId);
        }}
      />
    </div>
  );
};

export default ChatList;