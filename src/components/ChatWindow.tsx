import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation } from "@/pages/ChatPage";
import { Collaborator, Attachment } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  onSendMessage: (conversationId: string, text: string, attachment: Attachment | null) => void;
}

const ChatWindow = ({ selectedConversation, onSendMessage }: ChatWindowProps) => {
  const { user: currentUser } = useAuth();

  if (!selectedConversation || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  const handleSendMessage = (text: string, attachment: Attachment | null) => {
    onSendMessage(selectedConversation.id, text, attachment);
  };

  const otherMembers = selectedConversation.members.filter(m => m.id !== currentUser.id);
  const selectedCollaborator = otherMembers[0];

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        conversationName={selectedConversation.name}
        members={selectedConversation.members}
        isGroup={selectedConversation.isGroup}
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