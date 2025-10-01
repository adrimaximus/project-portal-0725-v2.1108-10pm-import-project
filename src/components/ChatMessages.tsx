import { Message } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquareReply, Paperclip } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: Message[];
  onReply: (message: Message) => void;
}

export const ChatMessages = ({ messages, onReply }: ChatMessagesProps) => {
  const { user } = useAuth();

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => {
        const isSender = message.sender.id === user?.id;
        return (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3",
              isSender ? "flex-row-reverse" : ""
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.avatar_url} />
              <AvatarFallback>
                {message.sender.name?.substring(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "p-3 rounded-lg max-w-md group relative",
              isSender ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <p className="font-semibold text-sm">{message.sender.name}</p>
              {message.isDeleted ? (
                <p className="text-sm italic text-muted-foreground">This message was deleted.</p>
              ) : (
                <>
                  {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
                  {message.attachmentUrl && (
                    <a
                      href={message.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-2 text-sm underline"
                    >
                      <Paperclip className="h-4 w-4" />
                      {message.attachmentName || 'View Attachment'}
                    </a>
                  )}
                </>
              )}
              <p className="text-xs opacity-70 mt-1 text-right">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {!isSender && !message.isDeleted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onReply(message)}
              >
                <MessageSquareReply className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};