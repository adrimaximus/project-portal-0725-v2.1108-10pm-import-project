import { useEffect, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Message } from "@/types";
import AiChatView from "./AiChatView";

interface ChatWindowProps {
  onBack: () => void;
}

const ChatWindow = ({ onBack }: ChatWindowProps) => {
  const { selectedConversation, sendMessage, isSendingMessage } = useChat();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  if (!selectedConversation) {
    return <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">Select a conversation to start chatting</div>;
  }

  if (selectedConversation.id === 'ai-assistant') {
    return <AiChatView ref={messagesEndRef} onBack={onBack} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={selectedConversation} onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <ChatConversation
          messages={selectedConversation.messages}
          members={selectedConversation.members || []}
          onReply={setReplyTo}
        />
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <ChatInput
          isSending={isSendingMessage}
          sendMessage={sendMessage}
          conversationId={selectedConversation.id}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
        />
      </div>
    </div>
  );
};

export default ChatWindow;