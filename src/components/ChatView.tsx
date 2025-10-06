import { useState, useRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import ChatInput from "./ChatInput";
import { Message } from "@/types";
import { ChatConversation } from "./ChatConversation";
import ChatPlaceholder from "./ChatPlaceholder";
import AiChatView from "./AiChatView";
import ChatHeader from "./ChatHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ChatView = () => {
  const { 
    selectedConversation, 
    isSomeoneTyping, 
    sendMessage, 
    sendTyping, 
    isSendingMessage, 
    leaveGroup, 
    refetchConversations 
  } = useChatContext();
  
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleClearChat = async (conversationId: string) => {
    const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
    if (error) {
      toast.error("Failed to clear chat history.");
    } else {
      toast.success("Chat history has been cleared.");
      refetchConversations();
    }
  };

  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  if (selectedConversation.id === 'ai-assistant') {
    return <AiChatView ref={inputRef} />;
  }

  const handleSendMessage = (text: string, attachmentFile: File | null) => {
    sendMessage(text, attachmentFile, replyTo?.id);
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        typing={isSomeoneTyping}
        conversation={selectedConversation}
        onLeaveGroup={leaveGroup}
        onClearChat={handleClearChat}
        onRefetchConversations={refetchConversations}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
        onReply={setReplyTo}
      />
      <ChatInput 
        ref={inputRef} 
        onSendMessage={handleSendMessage}
        onTyping={sendTyping}
        isSending={isSendingMessage}
        conversationId={selectedConversation.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default ChatView;