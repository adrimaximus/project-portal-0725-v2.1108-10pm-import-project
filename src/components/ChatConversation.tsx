import { Message, Collaborator, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Reply, MoreHorizontal, Star, Trash2, Forward } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceMessagePlayer from "./VoiceMessagePlayer";

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
  onReply: (message: Message) => void;
}

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  return format(parseISO(timestamp), "h:mm a");
};

const formatDateSeparator = (timestamp: string) => {
  if (!timestamp) return '';
  return format(parseISO(timestamp), "MMMM d, yyyy");
};

const ChatConversation = ({ messages, members, onReply }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();

  return (
    <div className="p-4 space-y-4">
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showDateSeparator = !prevMessage || !isSameDay(parseISO(prevMessage.timestamp), parseISO(message.timestamp));
        const isImageAttachment = message.attachment?.type.startsWith('image/');
        const isVoiceMessage = message.attachment?.type.startsWith('audio/');

        const sender = message.sender;
        const isCurrentUser = sender.id === currentUser?.id;

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="relative text-center my-4">
                <hr className="absolute top-1/2 left-0 w-full" />
                <span className="relative bg-background px-2 text-muted-foreground">
                  {formatDateSeparator(message.timestamp)}
                </span>
              </div>
            )}
            <div className={cn("flex items-start gap-3 group", isCurrentUser ? "flex-row-reverse" : "")}>
              <Avatar>
                <AvatarImage src={getAvatarUrl(sender.avatar_url, sender.id)} />
                <AvatarFallback style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
              </Avatar>
              <div className={cn("flex flex-col max-w-xs md:max-w-md lg:max-w-lg", isCurrentUser ? "items-end" : "items-start")}>
                <div className={cn(
                  "p-3 rounded-lg relative",
                  isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {message.repliedMessage && (
                    <div className="p-2 mb-1 text-sm bg-black/10 dark:bg-white/10 rounded-md border-l-2 border-primary">
                      <p className="font-semibold">{message.repliedMessage.senderName}</p>
                      <p className="text-xs line-clamp-2 opacity-80">
                        {message.repliedMessage.isDeleted ? "This message was deleted." : message.repliedMessage.content}
                      </p>
                    </div>
                  )}

                  {isImageAttachment && message.attachment && (
                    <img src={message.attachment.url} alt={message.attachment.name} className="rounded-md max-w-full h-auto mb-2" />
                  )}

                  {isVoiceMessage && message.attachment && (
                    <VoiceMessagePlayer audioUrl={message.attachment.url} sender={sender} />
                  )}

                  {!isVoiceMessage && (
                    <div className="flex items-end gap-2">
                      <div className="flex-grow min-w-0">
                        {message.text && <p className="text-sm break-words">{message.text}</p>}
                      </div>
                      {!isImageAttachment && (
                        <span className={cn(
                          "text-xs flex-shrink-0",
                          isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {formatTimestamp(message.timestamp)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {isImageAttachment && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-black/40 text-white rounded-full px-1.5 py-0.5">
                      <span className="text-xs">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                  <DropdownMenuItem onSelect={() => onReply(message)}><Reply className="mr-2 h-4 w-4" /> Reply</DropdownMenuItem>
                  <DropdownMenuItem><Star className="mr-2 h-4 w-4" /> Star</DropdownMenuItem>
                  <DropdownMenuItem><Forward className="mr-2 h-4 w-4" /> Forward</DropdownMenuItem>
                  {isCurrentUser && <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatConversation;