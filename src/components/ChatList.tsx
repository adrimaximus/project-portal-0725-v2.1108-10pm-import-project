import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquarePlus, Users } from "lucide-react";
import { Conversation } from "@/types";
import { Collaborator } from "@/types";
import NewChatDialog from "./NewChatDialog";
import NewGroupChatDialog from "./NewGroupChatDialog";
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
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupChatOpen, setIsNewGroupChatOpen] = useState(false);

  const filteredConversations = conversations.filter((c) =>
    c.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r">
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
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsNewChatOpen(true)}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsNewGroupChatOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" /> New Group
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted",
              selectedConversationId === c.id && "bg-muted"
            )}
            onClick={() => onSelectConversation(c.id)}
          >
            <Avatar>
              <AvatarImage src={c.userAvatar} />
              <AvatarFallback>{c.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{c.userName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {c.lastMessage}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{c.lastMessageTimestamp}</span>
          </div>
        ))}
      </div>
      <NewChatDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
      />
      <NewGroupChatDialog
        open={isNewGroupChatOpen}
        onOpenChange={setIsNewGroupChatOpen}
      />
    </div>
  );
};

export default ChatList;