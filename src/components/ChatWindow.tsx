import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation, Attachment } from "@/types";
import ChatPlaceholder from "./ChatPlaceholder";
import { forwardRef } from "react";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  onSendMessage: (text: string, attachment: Attachment | null) => void;
  onClearChat: (conversationId: string) => void;
  onLeaveGroup: (conversationId: string) => void;
  onUpdate: () => void;
  onBack?: () => void;
  typing?: boolean;
  onTyping?: () => void;
}

const ChatWindow = forwardRef<HTMLTextAreaElement, ChatWindowProps>(({ selectedConversation, onSendMessage, onClearChat, onLeaveGroup, onUpdate, onBack, typing, onTyping }, ref) => {
  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        selectedConversation={selectedConversation}
        onClearChat={onClearChat}
        onLeaveGroup={onLeaveGroup}
        onBack={onBack}
        typing={typing}
        onUpdate={onUpdate}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
      />
      <ChatInput 
        ref={ref}
        conversationId={selectedConversation.id}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
      />
    </div>
  );
});

export default ChatWindow;