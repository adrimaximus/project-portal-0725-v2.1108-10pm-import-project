import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn, generateVibrantGradient } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
}

const formatTimestamp = (timestamp: string) => {
  try {
    const date = parseISO(timestamp);
    if (isNaN(date.getTime())) return "";
    return format(date, 'p');
  } catch (e) {
    return "";
  }
};

const formatDateSeparator = (timestamp: string) => {
  try {
    const date = parseISO(timestamp);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'MMMM d, yyyy');
  } catch (e) {
    return "";
  }
};

const ChatConversation = ({ messages, members }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "auto", block: "end" });
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
        
        const showDateSeparator = !prevMessage || !isSameDay(parseISO(prevMessage.timestamp), parseISO(message.timestamp));

        return (
          <div key={message.id || index}>
            {showDateSeparator && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {formatDateSeparator(message.timestamp)}
                  </span>
                </div>
              </div>
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
                  <AvatarFallback style={generateVibrantGradient(sender.id)}>{sender.initials}</AvatarFallback>
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
                {!isCurrentUser && !isSameSenderAsPrevious && sender.id !== 'ai-assistant' && (
                  <p className="text-sm font-semibold mb-1">{sender.name}</p>
                )}
                <div className="flex items-end gap-2">
                  <div className="min-w-0">
                    {message.text && <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>}
                    {message.attachment && (
                      <MessageAttachment attachment={message.attachment} />
                    )}
                  </div>
                  <span className={cn(
                      "text-xs self-end flex-shrink-0",
                      isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                      {formatTimestamp(message.timestamp)}
                  </span>
                </div>
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