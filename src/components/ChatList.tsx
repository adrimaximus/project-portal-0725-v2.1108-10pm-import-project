import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquarePlus, MoreHorizontal, Trash2, Sparkles } from "lucide-react";
import NewConversationDialog from "./NewConversationDialog";
import { cn, getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import InteractiveText from "./InteractiveText";

interface ChatListProps {
  highlightedId?: string | null;
  onHighlightComplete?: () => void;
}

const isOnlyEmoji = (str: string) => {
  if (!str) return false;
  const emojiRegex = /^\p{Extended_Pictographic}+$/u;
  return emojiRegex.test(str.trim());
};

const ChatList = ({ highlightedId, onHighlightComplete }: ChatListProps) => {
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
    unreadConversationIds,
  } = useChatContext();
  const { user: currentUser, onlineCollaborators } = useAuth();
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    if (highlightedId && conversations.length > 0) {
      const element = itemRefs.current.get(highlightedId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-primary/10');
        const timer = setTimeout(() => {
          element.classList.remove('bg-primary/10');
          if (onHighlightComplete) onHighlightComplete();
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedId, onHighlightComplete, conversations]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-background w-full max-w-full overflow-hidden">
      <div className="p-3 md:p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        <div className="relative mt-3 md:mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="mt-3 md:mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsNewConversationOpen(true)}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 w-full">
        <div
          className={cn(
            "flex w-full items-center gap-3 p-3 hover:bg-muted border-l-4 border-transparent transition-colors group cursor-pointer max-w-full overflow-hidden",
            selectedConversation?.id === 'ai-assistant' && "bg-muted border-l-primary"
          )}
          onClick={() => selectConversation('ai-assistant')}
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden min-w-0">
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
          const finalAvatarUrl = getAvatarUrl(c.userAvatar, avatarSeed);
          const isUnread = unreadConversationIds.has(c.id);
          const onlineStatus = otherUser ? onlineCollaborators.find(onlineUser => onlineUser.id === otherUser.id) : null;
          const isOnline = onlineStatus && onlineStatus.isIdle === false;
          const isIdle = onlineStatus && onlineStatus.isIdle === true;
          const isLastMessageEmoji = isOnlyEmoji(c.lastMessage);

          return (
            <div
              key={c.id}
              ref={(el) => {
                if (el) itemRefs.current.set(c.id, el);
                else itemRefs.current.delete(c.id);
              }}
              className={cn(
                "flex w-full items-center gap-3 p-3 pr-4 hover:bg-muted border-l-4 border-transparent transition-colors group max-w-full overflow-hidden",
                selectedConversation?.id === c.id && "bg-muted border-l-primary"
              )}
            >
              <div
                className="flex-1 flex items-center gap-3 cursor-pointer min-w-0 overflow-hidden"
                onClick={() => selectConversation(c.id)}
              >
                <div className="relative flex-shrink-0">
                  <Avatar>
                    <AvatarImage src={finalAvatarUrl} />
                    <AvatarFallback style={generatePastelColor(otherUser?.id || c.id)}>{getInitials(c.userName)}</AvatarFallback>
                  </Avatar>
                  {otherUser && (isOnline || isIdle) && (
                    <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background ${isIdle ? 'bg-orange-400' : 'bg-green-500'}`} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("font-semibold truncate", isUnread && "text-primary")}>{c.userName}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimestamp(c.lastMessageTimestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={cn(
                      "text-sm text-muted-foreground w-full line-clamp-2 break-words",
                      isUnread && "text-foreground font-medium",
                      isLastMessageEmoji && "text-xl"
                    )}>
                      <InteractiveText text={c.lastMessage} members={c.members} />
                    </div>
                    {isUnread && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                </div>
              </div>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 opacity-100">
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
      </ScrollArea>
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