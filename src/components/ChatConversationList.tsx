import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Collaborator } from "../types";

type ChatConversationListProps = {
  conversations: Collaborator[];
  selectedConversation: Collaborator | null;
  onConversationSelect: (conversation: Collaborator) => void;
};

const ChatConversationList = ({ conversations, selectedConversation, onConversationSelect }: ChatConversationListProps) => {
  return (
    <div className="border-r bg-muted/40 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onConversationSelect(convo)}
              className={cn(
                "w-full flex items-center gap-3 text-left p-2 rounded-lg transition-colors",
                selectedConversation?.id === convo.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={convo.src} alt={convo.name} />
                <AvatarFallback>{convo.fallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{convo.name}</p>
                <p className={cn("text-sm", selectedConversation?.id === convo.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  Last message...
                </p>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ChatConversationList;