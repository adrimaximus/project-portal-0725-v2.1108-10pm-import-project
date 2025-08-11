import { Message, Collaborator } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import MessageAttachment from "./MessageAttachment";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ChatConversationProps {
  messages: Message[];
  selectedCollaborator: Collaborator;
}

const ChatConversation = ({ messages, selectedCollaborator }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender.id === currentUser.id;
        const sender = isCurrentUser ? currentUser : selectedCollaborator;
        
        return (
          <div
            key={index}
            className={cn(
              "flex items-end gap-2",
              isCurrentUser ? "justify-end" : "justify-start"
            )}
          >
            {!isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={sender.avatar} />
                <AvatarFallback>{sender.initials}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2",
                isCurrentUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              {message.attachment && (
                <MessageAttachment attachment={message.attachment} />
              )}
            </div>
            {isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={sender.avatar} />
                <AvatarFallback>{sender.initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChatConversation;