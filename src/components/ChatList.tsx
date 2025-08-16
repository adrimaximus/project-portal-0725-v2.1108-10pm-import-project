import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquarePlus } from "lucide-react";
import { Conversation } from "@/types";
import { Collaborator } from "@/types";
import NewConversationDialog from "./NewConversationDialog";
import { cn } from "@/lib/utils";

interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartNewChat: (collaborator: Collaborator) => void;
  onStartNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
}

const ChatList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onStartNewChat,
  onStartNewGroupChat,
}: ChatListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Chats</h2>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsNewConversationOpen(true)}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted border-l-4 border-transparent transition-colors",
              selectedConversationId === c.id && "bg-muted border-l-primary"
            )}
            onClick={() => onSelectConversation(c.id)}
          >
            <Avatar>
              <AvatarImage src={c.userAvatar} />
              <AvatarFallback>{c.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{c.userName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {c.lastMessage}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{c.lastMessageTimestamp}</span>
          </div>
        ))}
      </div>
      <NewConversationDialog
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
        onStartNewChat={onStartNewChat}
        onStartNewGroupChat={onStartNewGroupChat}
      />
    </div>
  );
};

export default ChatList;