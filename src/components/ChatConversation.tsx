import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import CommentRenderer from "./CommentRenderer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDown, Reply, Star, Pin, Forward, Copy, Trash2, CheckSquare } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
  onForwardMessage: (message: Message) => void;
  onSetReply: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  selectionMode: boolean;
  selectedMessages: Set<string>;
  onEnterSelectionMode: (messageId: string) => void;
  onToggleMessageSelection: (messageId: string) => void;
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

const ChatConversation = ({ messages, members, onForwardMessage, onSetReply, onDeleteMessage, selectionMode, selectedMessages, onEnterSelectionMode, onToggleMessageSelection }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !selectionMode) {
      scrollRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages, selectionMode]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  };

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

        const repliedToMessage = message.reply_to_message_id ? messages.find(m => m.id === message.reply_to_message_id) : null;
        const isForwarded = message.is_forwarded;

        if (message.is_deleted) {
          return (
            <div key={message.id} className={cn("flex items-center gap-2 my-2", isCurrentUser ? "justify-end" : "justify-start")}>
              <div className="text-sm italic text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                This message was deleted.
              </div>
            </div>
          );
        }

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
              onClick={() => selectionMode && onToggleMessageSelection(message.id)}
              className={cn(
                "flex items-start gap-3 py-1 px-2 rounded-md transition-colors group",
                isCurrentUser ? "justify-end" : "justify-start",
                isSameSenderAsPrevious ? "mt-1" : "mt-4",
                selectionMode && "cursor-pointer hover:bg-muted/50",
                selectedMessages.has(message.id) && "bg-muted"
              )}
            >
              {selectionMode && (
                <div className="flex items-center h-full pt-1">
                  <Checkbox checked={selectedMessages.has(message.id)} onCheckedChange={() => onToggleMessageSelection(message.id)} />
                </div>
              )}

              {!selectionMode && !isCurrentUser && !isSameSenderAsPrevious && sender && (
                <Avatar className="h-8 w-8 self-end">
                  <AvatarImage src={sender.avatar} />
                  <AvatarFallback>{sender.initials}</AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg rounded-lg relative",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200",
                  !isCurrentUser && (isSameSenderAsPrevious || selectionMode) && "ml-10",
                  !hasText && isImageAttachment ? "p-0 bg-transparent" : "px-3 py-2"
                )}
              >
                {!isCurrentUser && !isSameSenderAsPrevious && sender && (
                  <p className="text-sm font-semibold mb-1">{sender.name}</p>
                )}
                
                {isForwarded && (
                  <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1.5">
                    <Forward className="h-3 w-3" />
                    <span>Forwarded</span>
                  </div>
                )}

                {repliedToMessage && (
                  <div className="p-2 rounded-md mb-2 bg-black/20 border-l-2 border-white/50">
                    <p className="text-xs font-semibold">{repliedToMessage.sender?.name}</p>
                    <p className="text-xs opacity-80 line-clamp-2">{repliedToMessage.text || "Attachment"}</p>
                  </div>
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute top-1 right-1 h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                        isCurrentUser ? "bg-black/20 hover:bg-black/30" : "bg-white/20 hover:bg-white/30"
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                    <DropdownMenuItem onSelect={() => onSetReply(message)}><Reply className="mr-2 h-4 w-4" /><span>Reply</span></DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onForwardMessage(message)}><Forward className="mr-2 h-4 w-4" /><span>Forward</span></DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEnterSelectionMode(message.id)}><CheckSquare className="mr-2 h-4 w-4" /><span>Select Messages</span></DropdownMenuItem>
                    <DropdownMenuItem disabled><Star className="mr-2 h-4 w-4" /><span>Star</span></DropdownMenuItem>
                    <DropdownMenuItem disabled><Pin className="mr-2 h-4 w-4" /><span>Pin</span></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {hasText && <DropdownMenuItem onSelect={() => handleCopy(message.text!)}><Copy className="mr-2 h-4 w-4" /><span>Copy</span></DropdownMenuItem>}
                    {isCurrentUser && <DropdownMenuItem className="text-red-500" onSelect={() => onDeleteMessage(message.id)}><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
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