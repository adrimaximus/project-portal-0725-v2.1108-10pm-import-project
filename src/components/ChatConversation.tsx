import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Phone, Video } from "lucide-react";
import { Conversation, Message } from "@/data/chat";
import { cn } from "@/lib/utils";

interface ChatConversationProps {
  conversation: Conversation | null;
}

const ChatConversation = ({ conversation }: ChatConversationProps) => {
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Pilih percakapan untuk mulai mengobrol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.userAvatar} alt={conversation.userName} />
            <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{conversation.userName}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {conversation.messages.map((message: Message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-3",
              message.sender === 'me' ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === 'other' && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={conversation.userAvatar} alt={conversation.userName} />
                <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg",
                message.sender === 'me'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="relative">
          <Input placeholder="Ketik pesan..." className="pr-24" />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;