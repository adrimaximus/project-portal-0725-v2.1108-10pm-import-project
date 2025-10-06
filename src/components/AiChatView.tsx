import { useChat } from "@/contexts/ChatContext";
import { forwardRef, useMemo, useState } from "react";
import { Conversation, Message } from "@/types";
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";
import { ArrowLeft, Bot } from "lucide-react";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import useAiChat from "@/hooks/useAiChat";

interface AiChatViewProps {
  onBack: () => void;
}

const AiChatView = forwardRef<HTMLDivElement, AiChatViewProps>(({ onBack }, ref) => {
  const { conversation, sendMessage, isLoading } = useAiChat();
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const aiConversationObject = useMemo((): Conversation => ({
    id: 'ai-assistant',
    userName: 'AI Assistant',
    isGroup: false,
    members: [],
    created_by: 'system',
    messages: conversation,
    lastMessage: conversation[conversation.length - 1]?.text || "Ask me anything...",
    lastMessageTimestamp: conversation[conversation.length - 1]?.timestamp || new Date().toISOString(),
    unreadCount: 0,
  }), [conversation]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Ready to help</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" ref={ref}>
        <ChatConversation messages={aiConversationObject.messages} members={[]} onReply={setReplyTo} />
      </div>
      <div className="p-4 border-t">
        <ChatInput
          isSending={isLoading}
          sendMessage={sendMessage}
          conversationId="ai-assistant"
          replyTo={replyTo}
          setReplyTo={setReplyTo}
        />
      </div>
    </div>
  );
});

export default AiChatView;