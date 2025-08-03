import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/data/chat";
import { currentUserId } from "@/data/chat";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isCurrentUser = message.senderId === currentUserId;

  return (
    <div
      className={cn(
        "flex items-end gap-3",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2",
          isCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {!isCurrentUser && message.senderName && (
            <p className="text-xs font-semibold mb-1">{message.senderName}</p>
        )}
        <p className="text-sm">{message.text}</p>
        <p className="text-xs text-right mt-1 opacity-70">{message.timestamp}</p>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;