import { Input } from "@/components/ui/input";
import { Search, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Conversation } from "@/data/chat";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

const ChatList = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
}: ChatListProps) => {
  return (
    <div className="flex flex-col border-r bg-muted/40 h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Obrolan</h2>
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserPlus className="h-5 w-5" />
                    <span className="sr-only">New Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Users className="h-5 w-5" />
                    <span className="sr-only">New Group Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Group Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari obrolan..." className="pl-9" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onConversationSelect(convo.id)}
              className={cn(
                "w-full flex items-center gap-3 text-left p-3 rounded-lg transition-colors",
                selectedConversationId === convo.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={convo.userAvatar} alt={convo.userName} />
                <AvatarFallback>{convo.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="font-semibold">{convo.userName}</p>
                <p
                  className={cn(
                    "text-sm truncate",
                    selectedConversationId === convo.id
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {convo.lastMessage}
                </p>
              </div>
              <div className="flex flex-col items-end text-xs">
                <span
                  className={cn(
                    selectedConversationId === convo.id
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {convo.lastMessageTimestamp}
                </span>
                {convo.unreadCount > 0 && (
                  <Badge className="mt-1 h-5 w-5 justify-center p-0">
                    {convo.unreadCount}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ChatList;