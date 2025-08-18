import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation, Attachment } from "@/types";
import ChatPlaceholder from "./ChatPlaceholder";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  onSendMessage: (text: string, attachment: Attachment | null) => void;
  onClearChat: (conversationId: string) => void;
  onBack?: () => void;
  typing?: boolean;
  onTyping?: () => void;
}

const ChatWindow = ({ selectedConversation, onSendMessage, onClearChat, onBack, typing, onTyping }: ChatWindowProps) => {
  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        selectedConversation={selectedConversation}
        onClearChat={onClearChat}
        onBack={onBack}
        typing={typing}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
      />
      <ChatInput 
        conversationId={selectedConversation.id}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
      />
    </div>
  );
};

export default ChatWindow;