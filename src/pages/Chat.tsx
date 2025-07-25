import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import ChatList from "@/components/ChatList";
import ChatConversation from "@/components/ChatConversation";
import { dummyConversations, Message } from "@/data/chat";

const ChatPage = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    const selectedUserName = location.state?.selectedUserName;
    if (selectedUserName) {
      const conversation = conversations.find(c => c.userName === selectedUserName);
      if (conversation) {
        setSelectedConversationId(conversation.id);
      } else {
        setSelectedConversationId(conversations[0]?.id || null);
      }
    } else if (!selectedConversationId) {
      setSelectedConversationId(conversations[0]?.id || null);
    }
  }, [location.state, conversations, selectedConversationId]);

  const handleSendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      sender: 'me',
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => 
      prev.map(convo => 
        convo.id === conversationId 
          ? { ...convo, messages: [...convo.messages, newMessage] }
          : convo
      )
    );
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

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