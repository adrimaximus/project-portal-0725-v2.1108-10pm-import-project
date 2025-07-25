import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/data/chat";
import MessageAttachment from "./MessageAttachment";
import { currentUser } from "@/data/collaborators";
import { Collaborator } from "@/types";
import { cn } from "@/lib/utils";
import { Project } from "@/data/projects";

interface ChatConversationProps {
  messages: Message[];
  members?: Collaborator[];
  projects?: Project[];
}

const ChatConversation = ({ messages, members = [], projects = [] }: ChatConversationProps) => {
  const memberNames = members.map(m => m.name);
  const projectNames = projects.map(p => p.name);

  const renderMessageWithMentions = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let remainingText = text;
    let key = 0;

    while (remainingText.length > 0) {
      const atIndex = remainingText.indexOf('@');
      const slashIndex = remainingText.indexOf('/');

      let firstIndex = -1;
      let isUserMention = false;
      
      if (atIndex !== -1 && (slashIndex === -1 || atIndex < slashIndex)) {
        firstIndex = atIndex;
        isUserMention = true;
      } else if (slashIndex !== -1) {
        firstIndex = slashIndex;
      } else {
        parts.push(remainingText);
        break;
      }

      if (firstIndex > 0) {
        parts.push(remainingText.substring(0, firstIndex));
      }

      const mentionAndAfter = remainingText.substring(firstIndex);
      const textAfterMentionChar = mentionAndAfter.substring(1);
      const namesToSearch = isUserMention ? memberNames : projectNames;

      let matchedName: string | null = null;
      // Find the longest possible name match
      for (const name of namesToSearch) {
        if (textAfterMentionChar.startsWith(name)) {
          if (!matchedName || name.length > matchedName.length) {
            matchedName = name;
          }
        }
      }

      if (matchedName) {
        const content = isUserMention ? `@${matchedName}` : matchedName;
        parts.push(
          <strong key={key++} className="text-blue-600 font-semibold">
            {content}
          </strong>
        );
        remainingText = textAfterMentionChar.substring(matchedName.length);
      } else {
        parts.push(mentionAndAfter[0]);
        remainingText = textAfterMentionChar;
      }
    }

    return parts;
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {messages.map((message) => {
        const isMentioningCurrentUser = message.text.includes(`@${currentUser.name}`);
        
        return (
          <div 
            key={message.id} 
            className={cn(
              "flex items-start gap-4 transition-colors rounded-lg",
              isMentioningCurrentUser && "bg-blue-50 dark:bg-blue-950/50 p-3 -m-3"
            )}
          >
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
        );
      })}
    </div>
  );
};

export default ChatConversation;