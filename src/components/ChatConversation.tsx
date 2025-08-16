import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday } from 'date-fns';

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
}

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return ""; // Invalid date
    if (isToday(date)) {
      return format(date, 'p');
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'p')}`;
    }
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    return "";
  }
};

const ChatConversation = ({ messages, members }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender.id === currentUser.id;
        const sender = members.find(m => m.id === message.sender.id) || message.sender;
        
        const prevMessage = messages[index - 1];
        const isSameSenderAsPrevious = prevMessage && prevMessage.sender.id === message.sender.id;
        
        const showTimestamp = !isSameSenderAsPrevious || (prevMessage && new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 5 * 60 * 1000);

        return (
          <div key={message.id || index}>
            {showTimestamp && (
              <div className="text-center text-xs text-muted-foreground my-2">{formatTimestamp(message.timestamp)}</div>
            )}
            <div
              className={cn(
                "flex items-end gap-2",
                isCurrentUser ? "justify-end" : "justify-start",
                isSameSenderAsPrevious ? "mt-1" : "mt-4"
              )}
            >
              {!isCurrentUser && !isSameSenderAsPrevious && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sender.avatar} />
                  <AvatarFallback>{sender.initials}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                  !isCurrentUser && isSameSenderAsPrevious && "ml-10"
                )}
              >
                {!isCurrentUser && !isSameSenderAsPrevious && (
                  <p className="text-sm font-semibold mb-1">{sender.name}</p>
                )}
                {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
                {message.attachment && (
                  <MessageAttachment attachment={message.attachment} />
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
};

export default ChatConversation;