import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquarePlus, MoreHorizontal, Trash2, Sparkles } from "lucide-react";
import NewConversationDialog from "./NewConversationDialog";
import { cn, getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";

const ChatList = () => {
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const {
    conversations,
    selectedConversation,
    selectConversation,
    searchTerm,
    setSearchTerm,
    startNewChat,
    startNewGroupChat,
    deleteConversation,
  } = useChatContext();
  const { user: currentUser } = useAuth();

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "";
      return formatDistanceToNow(date, { addSuffix: true, locale: id });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

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
        <div
          className={cn(
            "flex items-center gap-3 p-3 hover:bg-muted border-l-4 border-transparent transition-colors group cursor-pointer",
            selectedConversation?.id === 'ai-assistant' && "bg-muted border-l-primary"
          )}
          onClick={() => selectConversation('ai-assistant')}
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">AI Assistant</p>
            <p className="text-sm text-muted-foreground truncate">
              Ask me anything...
            </p>
          </div>
        </div>
        <div className="px-4 py-2">
          <div className="border-t"></div>
        </div>
        {conversations.map((c) => {
          const otherUser = !c.isGroup ? c.members?.find(m => m.id !== currentUser?.id) : null;
          const avatarSeed = otherUser?.id || c.id;
          const finalAvatarUrl = getAvatarUrl(c.userAvatar, avatarSeed, c.isGroup);

          return (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-3 p-3 hover:bg-muted border-l-4 border-transparent transition-colors group",
                selectedConversation?.id === c.id && "bg-muted border-l-primary"
              )}
            >
              <div
                className="flex-1 flex items-center gap-3 overflow-hidden cursor-pointer"
                onClick={() => selectConversation(c.id)}
              >
                <Avatar>
                  <AvatarImage src={finalAvatarUrl} />
                  <AvatarFallback style={generatePastelColor(otherUser?.id || c.id)}>{getInitials(c.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{c.userName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {c.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(c.lastMessageTimestamp)}</span>
              </div>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Chat
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the chat from your list. You will not be able to see past messages. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteConversation(c.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        })}
      </div>
      <NewConversationDialog
        open={isNewConversationOpen}
        onOpenChange={setIsNewConversationOpen}
        onStartNewChat={startNewChat}
        onStartNewGroupChat={startNewGroupChat}
      />
    </div>
  );
};

export default ChatList;