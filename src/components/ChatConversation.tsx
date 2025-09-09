import { Message, Collaborator, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn, generatePastelColor } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Loader2, CornerUpLeft } from "lucide-react";
import { Button } from "./ui/button";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
  isLoading?: boolean;
  onReply: (message: Message) => void;
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

export const ChatConversation = ({ messages, members, isLoading, onReply }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const aiUser = members.find(m => m.id === 'ai-assistant');

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender.id === currentUser.id;
        const sender = members.find(m => m.id === message.sender.id) || message.sender;
        
        const prevMessage = messages[index - 1];
        const isSameSenderAsPrevious = prevMessage && prevMessage.sender.id === message.sender.id;
        
        const showDateSeparator = !prevMessage || !isSameDay(parseISO(prevMessage.timestamp), parseISO(message.timestamp));
        const isImageAttachment = message.attachment?.type.startsWith('image/');
        const isAudioAttachment = message.attachment?.type.startsWith('audio/');

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
                "flex items-end gap-2 group",
                isCurrentUser ? "justify-end" : "justify-start",
                isSameSenderAsPrevious ? "mt-1" : "mt-4"
              )}
            >
              {isCurrentUser && (
                <Button variant="ghost" size="icon" className="h-7 w-7 invisible group-hover:visible" onClick={() => onReply(message)}>
                  <CornerUpLeft className="h-4 w-4" />
                </Button>
              )}
              {!isCurrentUser && !isSameSenderAsPrevious && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sender.avatar_url} />
                  <AvatarFallback style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg rounded-lg",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                  isImageAttachment ? "p-1 overflow-hidden" : "px-3 py-2",
                  isAudioAttachment ? "p-0" : "",
                  !isCurrentUser && isSameSenderAsPrevious && "ml-10"
                )}
              >
                {!isCurrentUser && !isSameSenderAsPrevious && sender.id !== 'ai-assistant' && (
                  <p className="text-sm font-semibold mb-1">{sender.name}</p>
                )}
                
                {message.repliedMessage && (
                  <div className="p-2 mb-1 text-sm bg-black/10 dark:bg-white/10 rounded-md border-l-2 border-primary">
                    <p className="font-semibold">{message.repliedMessage.senderName}</p>
                    <p className="text-xs line-clamp-2 opacity-80">
                      {message.repliedMessage.isDeleted ? "This message was deleted." : message.repliedMessage.content}
                    </p>
                  </div>
                )}

                {isImageAttachment ? (
                  <div className="relative">
                    <a href={message.attachment!.url} target="_blank" rel="noopener noreferrer">
                      <img src={message.attachment!.url} alt={message.attachment!.name} className="max-w-full h-auto rounded-md" />
                    </a>
                    <div className="absolute bottom-1 right-1 flex items-end gap-2 w-full p-1 justify-end">
                      <div className="flex-grow min-w-0">
                        {message.text && <p className="text-white text-sm break-words">{message.text}</p>}
                      </div>
                      <span className="text-xs text-white/90 bg-black/40 rounded-full px-1.5 py-0.5 flex-shrink-0">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ) : isAudioAttachment ? (
                  <VoiceMessagePlayer 
                    src={message.attachment!.url} 
                    sender={message.sender} 
                    isCurrentUser={isCurrentUser}
                  />
                ) : (
                  <div className="flex items-end gap-2">
                    <div className="min-w-0">
                      {message.text && (
                        <div className={cn(
                          "text-sm whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none",
                          isCurrentUser ? "prose-p:text-primary-foreground" : "",
                          "[&_p]:my-0"
                        )}>
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => {
                                const href = props.href || '';
                                if (href.startsWith('/')) {
                                  return <Link to={href} {...props} className="text-inherit hover:text-inherit font-medium underline" />;
                                }
                                return <a {...props} target="_blank" rel="noopener noreferrer" className="text-inherit hover:text-inherit font-medium underline" />;
                              }
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </div>
                      )}
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
                )}
              </div>
              {!isCurrentUser && (
                <Button variant="ghost" size="icon" className="h-7 w-7 invisible group-hover:visible" onClick={() => onReply(message)}>
                  <CornerUpLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {isLoading && aiUser && (
        <div className="flex items-end gap-2 justify-start mt-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={aiUser.avatar_url} />
            <AvatarFallback style={generatePastelColor(aiUser.id)}>{aiUser.initials}</AvatarFallback>
          </Avatar>
          <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 bg-muted flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};