import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation } from "@/data/chat";
import { Collaborator, Attachment } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  onSendMessage: (text: string, attachment: Attachment | null) => void;
  onBack?: () => void;
}

const ChatWindow = ({ selectedConversation, onSendMessage, onBack }: ChatWindowProps) => {
  const { user: currentUser } = useAuth();

  if (!selectedConversation || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  const handleSendMessage = (text: string, attachment: Attachment | null) => {
    onSendMessage(text, attachment);
  };

  const otherMembers = selectedConversation.members?.filter(m => m.id !== currentUser.id) || [];
  const selectedCollaborator = otherMembers[0];

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        selectedConversation={selectedConversation}
        onBack={onBack}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        selectedCollaborator={selectedCollaborator}
      />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;