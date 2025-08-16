import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation, Attachment } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import ChatPlaceholder from "./ChatPlaceholder";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  onSendMessage: (text: string, attachment: Attachment | null) => void;
  onBack?: () => void;
}

const ChatWindow = ({ selectedConversation, onSendMessage, onBack }: ChatWindowProps) => {
  const { user: currentUser } = useAuth();

  if (!selectedConversation || !currentUser) {
    return <ChatPlaceholder />;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        selectedConversation={selectedConversation}
        onBack={onBack}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
      />
      <ChatInput 
        conversationId={selectedConversation.id}
        onSendMessage={onSendMessage} 
      />
    </div>
  );
};

export default ChatWindow;