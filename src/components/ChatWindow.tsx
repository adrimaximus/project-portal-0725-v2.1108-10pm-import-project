import { useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import { ChatConversation } from "./ChatConversation";
import { ChatInput } from "./ChatInput";
import ChatPlaceholder from "./ChatPlaceholder";
import { forwardRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import AiChatView from "./AiChatView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message } from "@/types";

interface ChatWindowProps {
  onBack?: () => void;
}

export const ChatWindow = forwardRef<HTMLTextAreaElement, ChatWindowProps>(({ onBack }, ref) => {
  const { selectedConversation, isSomeoneTyping, sendMessage, sendTyping, isSendingMessage, leaveGroup, refetchConversations, replyingTo, setReplyingTo } = useChatContext();

  const handleClearChat = async (conversationId: string) => {
    const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
    if (error) toast.error("Failed to clear chat history.");
    else {
      toast.success("Chat history has been cleared.");
      refetchConversations();
    }
  };

  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  if (selectedConversation.id === 'ai-assistant') {
    return <AiChatView ref={ref} onBack={onBack} />;
  }

  const handleSendMessage = (text: string, attachmentFile: File | null) => {
    sendMessage(text, attachmentFile, replyingTo?.id);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        onBack={onBack}
        typing={isSomeoneTyping}
        conversation={selectedConversation}
        onLeaveGroup={leaveGroup}
        onClearChat={handleClearChat}
        onRefetchConversations={refetchConversations}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
        onReply={setReplyingTo}
      />
      <ChatInput 
        ref={ref} 
        onSendMessage={handleSendMessage}
        onTyping={sendTyping}
        isSending={isSendingMessage}
        conversationId={selectedConversation.id}
        replyTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
});