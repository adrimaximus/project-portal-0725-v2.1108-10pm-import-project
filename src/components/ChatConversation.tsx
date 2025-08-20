import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import CommentRenderer from "./CommentRenderer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
        const prevMessage = messages[index - 1];
        const showDateSeparator = !prevMessage || !isSameDay(parseISO(prevMessage.timestamp), parseISO(message.timestamp));

        if (message.message_type === 'system_notification') {
          return (
            <div key={message.id || index}>
              {showDateSeparator && (
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{formatDateSeparator(message.timestamp)}</span></div>
                </div>
              )}
              <div className="text-center text-xs text-muted-foreground py-2 italic">
                {message.text}
              </div>
            </div>
          );
        }

        const isCurrentUser = message.sender?.id === currentUser.id;
        const sender = members.find(m => m.id === message.sender?.id) || message.sender;
        const isSameSenderAsPrevious = prevMessage && prevMessage.sender?.id === message.sender?.id && prevMessage.message_type !== 'system_notification';
        
        const isImageAttachment = message.attachment && message.attachment.type.startsWith('image/');
        const isFileAttachment = message.attachment && !message.attachment.type.startsWith('image/');
        const hasText = message.text && message.text.trim().length > 0;

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
              {!isCurrentUser && !isSameSenderAsPrevious && sender && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sender.avatar} />
                  <AvatarFallback>{sender.initials}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg rounded-lg group relative flex flex-col",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200",
                  !isCurrentUser && isSameSenderAsPrevious && "ml-10",
                  !hasText && isImageAttachment ? "p-0 bg-transparent" : "px-3 py-2"
                )}
              >
                {!isCurrentUser && !isSameSenderAsPrevious && sender && (
                  <p className="text-sm font-semibold mb-1">{sender.name}</p>
                )}
                
                {hasText && <CommentRenderer text={message.text!} members={members} />}
                
                {isImageAttachment && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className={cn("relative cursor-pointer", hasText && "mt-2")}>
                        <img 
                          src={message.attachment!.url} 
                          alt={message.attachment!.name} 
                          className="rounded-md max-w-full h-auto max-h-80 object-cover" 
                        />
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>{formatTimestamp(message.timestamp)}</span>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full h-[90vh] p-2 bg-transparent border-none">
                      <img src={message.attachment!.url} alt={message.attachment!.name} className="max-h-full w-auto object-contain mx-auto" />
                    </DialogContent>
                  </Dialog>
                )}

                {isFileAttachment && (
                  <MessageAttachment attachment={message.attachment!} />
                )}

                {!isImageAttachment && hasText && (
                  <div className="text-right text-xs mt-1 opacity-70 clear-both flex justify-end items-center gap-1">
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
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