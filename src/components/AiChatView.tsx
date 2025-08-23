import { useAuth } from "@/contexts/AuthContext";
import { useAiChat } from "@/hooks/useAiChat";
import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { forwardRef, useMemo } from "react";
import { Conversation } from "@/types";

interface AiChatViewProps {
  onBack?: () => void;
}

const AiChatView = forwardRef<HTMLTextAreaElement, AiChatViewProps>(({ onBack }, ref) => {
  const { user: currentUser } = useAuth();
  const { conversation, isLoading, sendMessage, aiUser } = useAiChat(currentUser);

  const aiConversationObject = useMemo((): Conversation => ({
    id: 'ai-assistant',
    userName: 'AI Assistant',
    userAvatar: aiUser.avatar,
    isGroup: false,
    members: [currentUser!, aiUser],
    messages: conversation,
    lastMessage: conversation[conversation.length - 1]?.text || "Ask me anything...",
    lastMessageTimestamp: conversation[conversation.length - 1]?.timestamp || new Date().toISOString(),
    unreadCount: 0,
  }), [aiUser, conversation, currentUser]);

  if (!currentUser) return null;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        onBack={onBack}
        conversation={aiConversationObject}
      />
      <ChatConversation
        messages={conversation}
        members={[currentUser, aiUser]}
      />
      <ChatInput 
        ref={ref} 
        onSendMessage={sendMessage}
        isSending={isLoading}
        conversationId="ai-assistant"
      />
    </div>
  );
});

export default AiChatView;