import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn, generatePastelColor, getInitials, getAvatarUrl, formatTimestamp } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { Button } from "./ui/button";
import NewConversationDialog from "./NewConversationDialog";
import { useState } from "react";

const ChatList = () => {
  const { 
    filteredConversations, 
    loading, 
    error, 
    selectedConversation, 
    selectConversation,
    searchTerm,
    setSearchTerm
  } = useChat();
  const { user: currentUser } = useAuth();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-10 w-full bg-muted rounded-md animate-pulse mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse"></div>
              <div className="h-3 w-1/2 bg-muted rounded-md animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-destructive">Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        <Button onClick={() => setIsNewChatOpen(true)}>New Chat</Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.map((c) => {
            const otherUser = !c.is_group ? c.participants?.find(m => m.id !== currentUser?.id) : null;
            const avatarSeed = otherUser?.id || c.id;
            const finalAvatarUrl = getAvatarUrl(c.avatar, avatarSeed, c.is_group);

            return (
              <div
                key={c.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedConversation?.id === c.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
                onClick={() => selectConversation(c.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={finalAvatarUrl} />
                  <AvatarFallback style={generatePastelColor(otherUser?.id || c.id)}>{getInitials(c.name || '')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {c.last_message_content}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(c.last_message_at)}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <NewConversationDialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
    </div>
  );
};

export default ChatList;