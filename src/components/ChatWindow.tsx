import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import { ChatConversation } from "./ChatConversation";
import { ChatInput } from "./ChatInput";
import ChatPlaceholder from "./ChatPlaceholder";
import { useChatContext } from "@/contexts/ChatContext";
import AiChatView from "./AiChatView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message } from "@/types";

interface ChatWindowProps {
  onBack?: () => void;
}

export const ChatWindow = forwardRef<HTMLTextAreaElement, ChatWindowProps>(({ onBack }, ref) => {
  const {
    selectedConversation,
    isSomeoneTyping,
    sendMessage,
    sendTyping,
    isSendingMessage,
    leaveGroup,
    refetchConversations,
    editingMessage,
    cancelEditingMessage,
    editMessage,
    isEditingMessage,
  } = useChatContext();
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const handleClearChat = async (conversationId: string) => {
    const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
    if (error) toast.error("Failed to clear chat history.");
    else {
      toast.success("Chat history has been cleared.");
      refetchConversations();
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setTimeout(() => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.focus();
      }
    }, 100);
  };

  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  if (selectedConversation.id === 'ai-assistant') {
    return <AiChatView ref={ref} onBack={onBack} />;
  }

  const handleSendMessage = (text: string, attachmentFile: File | null) => {
    if (editingMessage) {
      editMessage(editingMessage.id, text);
    } else {
      sendMessage(text, attachmentFile, replyTo?.id);
    }
    setReplyTo(null);
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
        onReply={handleReply}
      />
      <ChatInput 
        ref={ref} 
        onSendMessage={handleSendMessage}
        onTyping={sendTyping}
        isSending={isSendingMessage || isEditingMessage}
        conversationId={selectedConversation.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={cancelEditingMessage}
      />
    </div>
  );
});