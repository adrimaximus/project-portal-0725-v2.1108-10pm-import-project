import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ChatSidebarProps = {
  conversations: any[];
  selectedConversationId?: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
};

const ChatSidebarContent = ({ conversations, selectedConversationId }: Omit<ChatSidebarProps, 'isMobileOpen' | 'onMobileClose'>) => (
  <div className="flex h-full flex-col">
    <div className="p-4">
      <h2 className="text-2xl font-bold">Chats</h2>
      <div className="relative mt-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search chats..." className="pl-8" />
      </div>
    </div>
    <ScrollArea className="flex-1">
      <nav className="grid gap-1 p-2">
        {conversations.map((convo) => (
          <Link
            key={convo.id}
            to={`/chat/${convo.id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted",
              selectedConversationId === convo.id && "bg-muted text-primary"
            )}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={convo.otherUser.avatar} alt={convo.otherUser.name} />
                <AvatarFallback>{convo.otherUser.initials}</AvatarFallback>
              </Avatar>
              {convo.otherUser.online && (
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{convo.otherUser.name}</p>
              <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.content}</p>
            </div>
            <div className="ml-auto flex flex-col items-end text-xs">
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(convo.lastMessage.timestamp), { addSuffix: true })}
              </span>
              {convo.unreadCount > 0 && (
                <Badge className="mt-1">{convo.unreadCount}</Badge>
              )}
            </div>
          </Link>
        ))}
      </nav>
    </ScrollArea>
  </div>
);

const ChatSidebar = ({ conversations, selectedConversationId, isMobileOpen, onMobileClose }: ChatSidebarProps) => {
  const { conversationId } = useParams();
  const isConversationSelected = !!conversationId;

  return (
    <>
      <div className={cn(
        "hidden h-full w-full border-r bg-background md:w-80 md:block",
        isConversationSelected && "md:hidden lg:block"
      )}>
        <ChatSidebarContent conversations={conversations} selectedConversationId={selectedConversationId} />
      </div>
      <Sheet open={isMobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="p-0 w-80">
          <ChatSidebarContent conversations={conversations} selectedConversationId={selectedConversationId} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChatSidebar;