import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn, generatePastelColor, formatMentionsForDisplay } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Loader2, Download, Share } from "lucide-react";
import { Button } from "./ui/button";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import MessageReactions from "./MessageReactions";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatMessageActions } from "./ChatMessageActions";

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
  const { toggleReaction } = useChatContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/10', 'rounded-md');
      setTimeout(() => {
        element.classList.remove('bg-primary/10', 'rounded-md');
      }, 1500);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const aiUser = members.find(m => m.id === 'ai-assistant');
  const isAiChat = !!aiUser;

  return (
    <div className="flex-1 relative">
      <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto p-4 space-y-1">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender.id === currentUser.id;
          const sender = members.find(m => m.id === message.sender.id) || message.sender;
          
          const prevMessage = messages[index - 1];
          const isSameSenderAsPrevious = prevMessage && prevMessage.sender.id === message.sender.id;
          
          const showDateSeparator = !prevMessage || !isSameDay(parseISO(prevMessage.timestamp), parseISO(message.timestamp));
          const isImageAttachment = message.attachment?.type.startsWith('image/');
          const isAudioAttachment = message.attachment?.type.startsWith('audio/');

          return (
            <div key={message.id || index} id={`message-${message.id}`} className="transition-all duration-500">
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
                <div className={cn("flex items-center gap-1", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
                  {!isCurrentUser && !isSameSenderAsPrevious && (
                    <Avatar className="h-8 w-8 self-end">
                      <AvatarImage src={sender.avatar_url} />
                      <AvatarFallback style={generatePastelColor(sender.id)}>{sender.initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg rounded-lg relative group",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                      isImageAttachment ? "p-1 overflow-hidden" : (message.is_deleted ? "" : "px-3 py-2"),
                      isAudioAttachment ? "p-0" : "",
                      !isCurrentUser && isSameSenderAsPrevious && "ml-10"
                    )}
                  >
                    {!isCurrentUser && !isSameSenderAsPrevious && sender.id !== 'ai-assistant' && (
                      <p className="text-sm font-semibold mb-1">{sender.name}</p>
                    )}
                    
                    {message.is_deleted ? (
                      <div className="flex items-end gap-2 px-3 py-2">
                        <p className="text-sm italic text-muted-foreground flex-grow">
                          {isCurrentUser ? "You deleted this message" : `${message.sender.name} deleted this message`}
                        </p>
                        <span className={cn(
                            "text-xs self-end flex-shrink-0",
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                            {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                    ) : (
                      <>
                        {message.is_forwarded && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs mb-1",
                            isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            <Share className="h-3 w-3" />
                            <span>Forwarded</span>
                          </div>
                        )}
                        {message.repliedMessage && message.reply_to_message_id && (
                          <button 
                            onClick={() => handleScrollToMessage(message.reply_to_message_id!)}
                            className="w-full text-left p-2 mb-1 text-sm bg-black/10 dark:bg-white/10 rounded-md border-l-2 border-primary hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                          >
                            <p className="font-semibold">{message.repliedMessage.senderName}</p>
                            <p className="text-xs line-clamp-2 opacity-80">
                              {message.repliedMessage.isDeleted ? "This message was deleted." : formatMentionsForDisplay(message.repliedMessage.content)}
                            </p>
                          </button>
                        )}

                        {isImageAttachment ? (
                          <div className="relative group/image">
                            <a href={message.attachment!.url} target="_blank" rel="noopener noreferrer">
                              <img src={message.attachment!.url} alt={message.attachment!.name} className="max-w-full h-auto rounded-md" />
                            </a>
                            <div className="absolute top-1 right-1 opacity-0 group-hover/image:opacity-100 transition-opacity">
                              <a
                                href={message.attachment!.url}
                                download={message.attachment!.name}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white hover:text-white">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                            </div>
                            <div className="absolute bottom-1 right-1 flex items-end gap-2 w-full p-1 justify-end">
                              <div className="flex-grow min-w-0">
                                {message.text && <p className="text-white text-sm break-words bg-black/40 rounded-md px-2 py-1 inline-block">{message.text}</p>}
                              </div>
                              <div className="flex-shrink-0 self-end flex items-center gap-0 bg-black/40 rounded-full pl-1.5">
                                <span className="text-xs text-white/90 py-0.5">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                                <ChatMessageActions message={message} isCurrentUser={isCurrentUser} onReply={onReply} className="text-white/90 hover:bg-white/20" />
                              </div>
                            </div>
                          </div>
                        ) : isAudioAttachment ? (
                          <div className="flex items-center">
                            <VoiceMessagePlayer 
                              src={message.attachment!.url} 
                              sender={message.sender} 
                              isCurrentUser={isCurrentUser}
                            />
                            <div className="pl-1">
                               <ChatMessageActions message={message} isCurrentUser={isCurrentUser} onReply={onReply} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-end gap-2">
                            <div className="min-w-0 flex-grow">
                              {message.text && (
                                <div className={cn(
                                  "text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none [&_p]:my-0",
                                  isCurrentUser ? "prose-invert" : "dark:prose-invert"
                                )}>
                                  <ReactMarkdown
                                    components={{
                                      a: ({ node, ...props }) => {
                                        const href = props.href || '';
                                        if (href.startsWith('/')) {
                                          return <Link to={href} {...props} className="font-medium underline" />;
                                        }
                                        return <a {...props} target="_blank" rel="noopener noreferrer" className="font-medium underline" />;
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
                            <div className="flex-shrink-0 self-end flex items-center gap-0">
                                <span className={cn(
                                    "text-xs",
                                    isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                    {formatTimestamp(message.timestamp)}
                                </span>
                                <ChatMessageActions message={message} isCurrentUser={isCurrentUser} onReply={onReply} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {!isAiChat && <MessageReactions reactions={message.reactions || []} onToggleReaction={(emoji) => toggleReaction(message.id, emoji)} />}
                  </div>
                </div>
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
    </div>
  );
};