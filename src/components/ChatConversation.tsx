import { Message, Collaborator, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn, generatePastelColor, getInitials, getAvatarUrl } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Reply } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceMessagePlayer from "./VoiceMessagePlayer";

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
  isLoading?: boolean;
  onReply: (message: Message) => void;
}

const ChatConversation = ({ messages, members, isLoading, onReply }: ChatConversationProps) => {
  const groupMessages = (messages: Message[]) => {
    if (!messages) return [];
    const grouped = [];
    let lastSenderId = null;
    let lastTimestamp = null;

    for (const message of messages) {
      const currentTimestamp = new Date(message.created_at);
      const isSameSender = message.sender_id === lastSenderId;
      const isWithin5Mins = lastTimestamp && (currentTimestamp.getTime() - lastTimestamp.getTime()) < 5 * 60 * 1000;

      if (isSameSender && isWithin5Mins) {
        grouped[grouped.length - 1].messages.push(message);
      } else {
        grouped.push({
          senderId: message.sender_id,
          messages: [message],
        });
      }
      lastSenderId = message.sender_id;
      lastTimestamp = currentTimestamp;
    }
    return grouped;
  };

  const groupedMessages = groupMessages(messages);

  return (
    <div className="p-4 space-y-4">
      {groupedMessages.map((group, groupIndex) => {
        const sender = members.find(m => m.id === group.senderId);
        if (!sender) return null;

        const isCurrentUser = sender.id === members[0]?.id; // Assuming current user is first in members list

        return (
          <div key={groupIndex} className={cn("flex items-start gap-3", isCurrentUser ? "justify-end" : "")}>
            {!isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(sender.avatar_url, sender.id)} />
                <AvatarFallback style={generatePastelColor(sender.id)}>{getInitials(sender.name)}</AvatarFallback>
              </Avatar>
            )}
            <div className={cn("flex flex-col gap-1", isCurrentUser ? "items-end" : "items-start")}>
              {!isCurrentUser && groupIndex === 0 && (
                <p className="text-xs text-muted-foreground">{sender.name}</p>
              )}
              {group.messages.map((message, msgIndex) => (
                <div
                  key={message.id}
                  className={cn(
                    "group relative max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted rounded-bl-none"
                  )}
                >
                  {message.replied_message_content && (
                    <div className="p-2 mb-1 text-sm bg-black/10 dark:bg-white/10 rounded-md border-l-2 border-primary">
                      <p className="font-semibold">{message.replied_message_sender_name}</p>
                      <p className="text-xs line-clamp-2 opacity-80">
                        {message.replied_message_is_deleted ? "This message was deleted." : message.replied_message_content}
                      </p>
                    </div>
                  )}

                  {message.attachment?.type.startsWith('audio/') ? (
                    <VoiceMessagePlayer audioUrl={message.attachment.url} sender={sender} />
                  ) : (
                    <>
                      {message.attachment && (
                        <div className="mb-1">
                          <a href={message.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline">
                            {message.attachment.name}
                          </a>
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        {message.content && <p className="text-sm break-words">{message.content}</p>}
                      </div>
                    </>
                  )}
                  
                  <div className={cn("absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity", isCurrentUser ? "-left-8" : "-right-8")}>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(message)}>
                      <Reply className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {isLoading && <div className="text-center text-muted-foreground">Loading messages...</div>}
    </div>
  );
};

export default ChatConversation;