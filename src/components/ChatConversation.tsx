import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/data/chat";
import { File, Image } from "lucide-react";

interface ChatConversationProps {
  messages: Message[];
}

const ChatConversation = ({ messages }: ChatConversationProps) => {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-4",
            message.sender === "me" && "flex-row-reverse"
          )}
        >
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={message.senderAvatar} />
            <AvatarFallback>
              {message.senderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "max-w-md rounded-lg px-4 py-3",
              message.sender === "me"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <p className="font-semibold text-sm mb-1">{message.senderName}</p>
            <p className="text-sm">{message.text}</p>
            {message.attachment && (
              <a
                href={message.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-2 flex items-center gap-2 rounded-md p-2",
                  message.sender === "me" ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-background/50 hover:bg-background"
                )}
              >
                {message.attachment.type === 'image' ? (
                  <Image className="h-5 w-5" />
                ) : (
                  <File className="h-5 w-5" />
                )}
                <span className="text-sm font-medium truncate">{message.attachment.name}</span>
              </a>
            )}
            <p
              className={cn(
                "text-xs mt-2",
                message.sender === "me"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {message.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatConversation;