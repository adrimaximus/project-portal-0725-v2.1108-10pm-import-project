import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/data/chat";
import MessageAttachment from "./MessageAttachment";
import { currentUser } from "@/data/collaborators";
import { Collaborator } from "@/types";

interface ChatConversationProps {
  messages: Message[];
  members?: Collaborator[];
}

const ChatConversation = ({ messages, members = [] }: ChatConversationProps) => {
  const memberNames = members.map(m => m.name);

  const renderMessageWithMentions = (text: string) => {
    const words = text.split(/(\s+)/); // Split by space, keeping the space
    return words.map((word, index) => {
      if (word.startsWith('@')) {
        const mentionName = word.substring(1);
        if (memberNames.includes(mentionName)) {
          return (
            <strong key={index} className="text-primary font-semibold">
              {word}
            </strong>
          );
        }
      }
      return word;
    });
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {messages.map((message) => (
        <div key={message.id} className="flex items-start gap-4">
          <Avatar className="h-9 w-9 border">
            <AvatarImage
              src={message.senderName === "You" ? currentUser.src : message.senderAvatar}
              alt={message.senderName}
            />
            <AvatarFallback>
              {message.senderName === "You" ? "ME" : message.senderName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1.5 w-full">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{message.senderName}</p>
              <p className="text-xs text-muted-foreground">{message.timestamp}</p>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {renderMessageWithMentions(message.text)}
            </p>
            {message.attachment && (
              <MessageAttachment attachment={message.attachment} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatConversation;