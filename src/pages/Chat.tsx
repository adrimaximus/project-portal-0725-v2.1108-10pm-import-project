import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import ChatList from "@/components/ChatList";
import ChatConversation from "@/components/ChatConversation";
import { useChat } from "@/context/ChatContext";

const ChatPage = () => {
  const location = useLocation();
  const { 
    conversations, 
    handleSendMessage, 
    getConversationById
  } = useChat();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    const { selectedConversationId: navStateId } = location.state || {};
    
    if (navStateId && navStateId !== selectedConversationId) {
      setSelectedConversationId(navStateId);
    } else if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [location.state, conversations, selectedConversationId]);

  const selectedConversation = getConversationById(selectedConversationId);

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-[300px_1fr] h-full w-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
        />
        <ChatConversation 
          conversation={selectedConversation}
          onSendMessage={handleSendMessage} 
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;