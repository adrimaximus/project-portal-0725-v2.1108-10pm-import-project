import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import ChatPlaceholder from "./ChatPlaceholder";
import { forwardRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";

interface ChatWindowProps {
  onBack?: () => void;
}

const ChatWindow = forwardRef<HTMLTextAreaElement, ChatWindowProps>(({ onBack }, ref) => {
  const { selectedConversation, isSomeoneTyping } = useChatContext();

  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        onBack={onBack}
        typing={isSomeoneTyping}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
      />
      <ChatInput ref={ref} />
    </div>
  );
});

export default ChatWindow;