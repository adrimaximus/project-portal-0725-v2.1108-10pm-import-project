import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Send, Paperclip, Mic, ArrowLeft } from "lucide-react";

type ChatViewProps = {
  conversation: any;
  onToggleSidebar: () => void;
};

const ChatView = ({ conversation, onToggleSidebar }: ChatViewProps) => {
  const [messages, setMessages] = useState(conversation.messages);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.children[1] as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const message = {
      id: `msg-${Date.now()}`,
      sender: "user-1",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to conversations</span>
        </Button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.otherUser.avatar} alt={conversation.otherUser.name} />
              <AvatarFallback>{conversation.otherUser.initials}</AvatarFallback>
            </Avatar>
            {conversation.otherUser.online && (
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            )}
          </div>
          <div>
            <p className="font-semibold">{conversation.otherUser.name}</p>
            <p className="text-xs text-muted-foreground">{conversation.otherUser.online ? "Online" : "Offline"}</p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 md:p-6">
            <div className="space-y-6">
              {messages.map((message: any, index: number) => {
                const isOwnMessage = message.sender === "user-1";
                const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-3",
                      isOwnMessage && "flex-row-reverse"
                    )}
                  >
                    {!isOwnMessage && (
                      <Avatar className={cn("h-8 w-8", !showAvatar && "invisible")}>
                        <AvatarImage src={conversation.otherUser.avatar} />
                        <AvatarFallback>{conversation.otherUser.initials}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-xs rounded-lg p-3 text-sm md:max-w-md",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p>{message.content}</p>
                      <p className={cn("mt-1 text-xs", isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {format(new Date(message.timestamp), "p")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
      <footer className="border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="pr-28"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Mic className="h-5 w-5" />
            </Button>
            <Button type="submit" variant="ghost" size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default ChatView;