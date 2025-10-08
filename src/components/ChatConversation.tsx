import { Message, Reaction, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn, generatePastelColor } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format } from 'date-fns';
import { Bot, CornerDownLeft, File as FileIcon, Forward, Star, Trash2, Smile } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

interface ChatConversationProps {
  messages: Message[];
  onReply: (message: Message) => void;
}

const MessageBubble = ({ message, isCurrentUser, onReply }: { message: Message, isCurrentUser: boolean, onReply: (message: Message) => void }) => {
  const { sender, content, createdAt, attachment, replyTo, isDeleted, reactions } = message;

  const renderContent = () => {
    if (isDeleted) {
      return <p className="text-sm italic text-muted-foreground">This message was deleted.</p>;
    }
    if (attachment) {
      if (attachment.type?.startsWith('audio/')) {
        return <VoiceMessagePlayer src={attachment.url} sender={sender} />;
      }
      return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-muted p-2 rounded-md hover:bg-muted/80">
          <FileIcon className="h-6 w-6" />
          <span>{attachment.name}</span>
        </a>
      );
    }
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className={cn("flex items-start gap-3 group", isCurrentUser ? "flex-row-reverse" : "")}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={sender.avatar_url} />
        <AvatarFallback style={{ backgroundColor: generatePastelColor(sender.id) }}>{sender.initials}</AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col max-w-md", isCurrentUser ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2">
          {!isCurrentUser && <span className="font-semibold text-sm">{sender.name}</span>}
          <span className="text-xs text-muted-foreground">{format(new Date(createdAt), 'p')}</span>
        </div>
        <div className={cn(
          "relative p-3 rounded-lg mt-1",
          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {replyTo && (
            <div className="border-l-2 border-primary/50 pl-2 mb-2 text-xs opacity-80">
              <p className="font-semibold">{replyTo.senderName}</p>
              <p className="line-clamp-1">{replyTo.isDeleted ? "This message was deleted" : replyTo.content}</p>
            </div>
          )}
          {renderContent()}
          {reactions && reactions.length > 0 && (
            <div className="absolute -bottom-3 right-2 flex gap-1">
              {reactions.map((r, i) => (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="bg-background border rounded-full px-1.5 py-0.5 text-xs">
                        {r.emoji}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{r.user_name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </div>
      {!isDeleted && (
        <div className={cn("hidden group-hover:flex items-center gap-1 self-center", isCurrentUser ? "mr-2" : "ml-2")}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><button className="p-1 rounded-full hover:bg-muted"><Smile className="h-4 w-4" /></button></TooltipTrigger>
              <TooltipContent>React</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><button onClick={() => onReply(message)} className="p-1 rounded-full hover:bg-muted"><CornerDownLeft className="h-4 w-4" /></button></TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><button className="p-1 rounded-full hover:bg-muted"><Forward className="h-4 w-4" /></button></TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><button className="p-1 rounded-full hover:bg-muted"><Star className="h-4 w-4" /></button></TooltipTrigger>
              <TooltipContent>Star</TooltipContent>
            </Tooltip>
            {isCurrentUser && (
              <Tooltip>
                <TooltipTrigger asChild><button className="p-1 rounded-full hover:bg-muted"><Trash2 className="h-4 w-4 text-red-500" /></button></TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

const AIMessageBubble = ({ message }: { message: Message }) => {
  const { sender, content, createdAt } = message;
  return (
    <div className="flex items-start gap-3 group">
      <Avatar className="h-10 w-10">
        <AvatarImage src={sender.avatar_url} />
        <AvatarFallback style={{ backgroundColor: generatePastelColor(sender.id) }}>{sender.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col max-w-md items-start">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm flex items-center gap-1"><Bot className="h-4 w-4" /> {sender.name}</span>
          <span className="text-xs text-muted-foreground">{format(new Date(createdAt), 'p')}</span>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mt-1">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default function ChatConversation({ messages, onReply }: ChatConversationProps) {
  const { user } = useAuth();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const aiUser = {
    id: 'ai-assistant',
    name: 'AI Assistant',
    avatar_url: '',
    initials: 'AI',
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="space-y-6">
        {messages.map((message) => {
          if (message.sender.id === 'ai-assistant') {
            return <AIMessageBubble key={message.id} message={message} />;
          }
          const isCurrentUser = message.sender.id === user?.id;
          return <MessageBubble key={message.id} message={message} isCurrentUser={isCurrentUser} onReply={onReply} />;
        })}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}