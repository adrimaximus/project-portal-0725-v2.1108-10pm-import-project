import React, { useEffect, useRef } from 'react';
import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn, generatePastelColor, formatMentionsForDisplay, getInitials, getAvatarUrl } from "@/lib/utils";
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Loader2, Share, Camera, Mic, Ban } from "lucide-react";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import MessageReactions from "./MessageReactions";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatMessageActions } from "./ChatMessageActions";
import rehypeRaw from 'rehype-raw';
import remarkGfm from "remark-gfm";
import FileIcon from './FileIcon';

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
  isLoading?: boolean;
  onReply: (message: Message) => void;
}

const isEmojiOnly = (str: string | null | undefined): boolean => {
  if (!str) return false;
  // This regex checks for any character that is NOT an emoji-related character or whitespace.
  // If such a character is found, it's not an emoji-only string. This correctly excludes numbers.
  const nonEmojiRegex = /[^\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\u200D\uFE0F\s]/u;
  return !nonEmojiRegex.test(str.trim());
};

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
          
          return (
            <React.Fragment key={message.id || index}>
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
              {message.is_deleted ? (
                <div id={`message-${message.id}`} className="flex justify-center items-center gap-2 my-2 text-muted-foreground text-sm py-1">
                  <Ban className="h-4 w-4 flex-shrink-0" />
                  <p className="italic">
                    {isCurrentUser ? "You deleted this message" : `${sender.name} deleted this message`}
                  </p>
                  <span className="text-xs text-muted-foreground/80">{formatTimestamp(message.timestamp)}</span>
                </div>
              ) : (
                (() => {
                  const isImageAttachment = message.attachment?.type.startsWith('image/');
                  const isAudioAttachment = message.attachment?.type.startsWith('audio/');
                  const isOnlyEmoji = isEmojiOnly(message.text);

                  return (
                    <div
                      id={`message-${message.id}`}
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
                        <div className={cn("flex flex-col", isCurrentUser ? "items-end" : "items-start", !isCurrentUser && isSameSenderAsPrevious && "ml-10")}>
                          <div
                            className={cn(
                              "max-w-xs md:max-w-md lg:max-w-lg rounded-lg relative group",
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted",
                              isImageAttachment ? "p-px overflow-hidden" : "px-2 py-1",
                              isAudioAttachment ? "p-0" : ""
                            )}
                          >
                            {!isCurrentUser && !isSameSenderAsPrevious && sender.id !== 'ai-assistant' && (
                              <p className="text-sm font-semibold mb-1">{sender.name}</p>
                            )}
                            
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
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 overflow-hidden">
                                      <p className="font-semibold">{message.repliedMessage.senderName}</p>
                                      <div className={cn(
                                          "text-xs line-clamp-2 opacity-80 prose prose-sm max-w-none",
                                          isCurrentUser 
                                              ? "prose-invert prose-p:text-primary-foreground prose-a:text-primary-foreground" 
                                              : "dark:prose-invert"
                                      )}>
                                        {message.repliedMessage.isDeleted ? (
                                          <p className="italic">This message was deleted.</p>
                                        ) : message.repliedMessage.attachment ? (
                                          <div className="flex items-center gap-1.5">
                                            {message.repliedMessage.attachment.type?.startsWith('image/') && <Camera className="h-3 w-3 flex-shrink-0" />}
                                            {message.repliedMessage.attachment.type?.startsWith('audio/') && <Mic className="h-3 w-3 flex-shrink-0" />}
                                            {!message.repliedMessage.attachment.type?.startsWith('image/') && !message.repliedMessage.attachment.type?.startsWith('audio/') && <FileIcon fileType={message.repliedMessage.attachment.type || ''} className="h-3 w-3 flex-shrink-0" />}
                                            <span className="truncate">{message.repliedMessage.content || message.repliedMessage.attachment.name}</span>
                                          </div>
                                        ) : (
                                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                            {formatMentionsForDisplay(message.repliedMessage.content || '')}
                                          </ReactMarkdown>
                                        )}
                                      </div>
                                    </div>
                                    {message.repliedMessage.attachment?.type?.startsWith('image/') && (
                                      <img src={message.repliedMessage.attachment.url} alt="Reply preview" className="h-10 w-10 object-cover rounded-md ml-2 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
                              )}

                              {isImageAttachment ? (
                                <div>
                                  <div className="relative group/image">
                                    <a href={message.attachment!.url} target="_blank" rel="noopener noreferrer">
                                      <img src={message.attachment!.url} alt={message.attachment!.name} className="max-w-full h-auto rounded-md" />
                                    </a>
                                    {!message.text && (
                                      <div className="absolute bottom-1 right-1 flex items-end">
                                        <div className="flex-shrink-0 self-end flex items-center gap-0 bg-black/40 rounded-full pl-1.5">
                                          <span className="text-xs text-white/90 py-0.5">
                                            {formatTimestamp(message.timestamp)}
                                          </span>
                                          <ChatMessageActions message={message} isCurrentUser={isCurrentUser} onReply={onReply} className="text-white/90 hover:bg-white/20" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {message.text && (
                                    <div className="pt-2 px-1 flex items-end gap-2">
                                      <div className="min-w-0 flex-grow">
                                        <div className={cn(
                                          "text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none [&_p]:my-0",
                                          isCurrentUser ? "prose-invert prose-p:text-primary-foreground prose-a:text-primary-foreground" : "dark:prose-invert"
                                        )}>
                                          <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                              a: ({ node, ...props }) => {
                                                const href = props.href || '';
                                                if (href.startsWith('/')) {
                                                  return <Link to={href} {...props} className="font-medium underline" />;
                                                }
                                                return <a {...props} target="_blank" rel="noopener noreferrer" className="font-medium underline" />;
                                              },
                                              p: ({ node, ...props }) => {
                                                const processedChildren = React.Children.map(props.children, child => {
                                                  if (typeof child === 'string') {
                                                    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Component}|\p{Extended_Pictographic}|[\u200D\uFE0F]+)/u;
                                                    const parts = child.split(emojiRegex);
                                                    return parts.map((part, i) => 
                                                      part.match(emojiRegex) 
                                                        ? <span key={i} className="text-lg inline-block align-middle">{part}</span> 
                                                        : part
                                                    );
                                                  }
                                                  return child;
                                                });
                                                return <p {...props}>{processedChildren}</p>;
                                              }
                                            }}
                                          >
                                            {formatMentionsForDisplay(message.text || '')}
                                          </ReactMarkdown>
                                        </div>
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
                                      isOnlyEmoji ? (
                                        <div className="text-3xl">{message.text}</div>
                                      ) : (
                                        <div className={cn(
                                          "text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none [&_p]:my-0",
                                          isCurrentUser ? "prose-invert prose-p:text-primary-foreground prose-a:text-primary-foreground" : "dark:prose-invert"
                                        )}>
                                          <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                              a: ({ node, ...props }) => {
                                                const href = props.href || '';
                                                if (href.startsWith('/')) {
                                                  return <Link to={href} {...props} className="font-medium underline" />;
                                                }
                                                return <a {...props} target="_blank" rel="noopener noreferrer" className="font-medium underline" />;
                                              },
                                              p: ({ node, ...props }) => {
                                                const processedChildren = React.Children.map(props.children, child => {
                                                  if (typeof child === 'string') {
                                                    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Component}|\p{Extended_Pictographic}|[\u200D\uFE0F]+)/u;
                                                    const parts = child.split(emojiRegex);
                                                    return parts.map((part, i) => 
                                                      part.match(emojiRegex) 
                                                        ? <span key={i} className="text-lg inline-block align-middle">{part}</span> 
                                                        : part
                                                    );
                                                  }
                                                  return child;
                                                });
                                                return <p {...props}>{processedChildren}</p>;
                                              }
                                            }}
                                          >
                                            {formatMentionsForDisplay(message.text || '')}
                                          </ReactMarkdown>
                                        </div>
                                      )
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
                          </div>
                          {!isAiChat && <MessageReactions reactions={message.reactions || []} onToggleReaction={(emoji) => toggleReaction(message.id, emoji)} />}
                        </div>
                      </div>
                    </div>
                  )
                })()
              )}
            </React.Fragment>
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