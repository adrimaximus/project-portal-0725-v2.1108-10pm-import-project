import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import ChatList from "@/components/ChatList";
import ChatConversation from "@/components/ChatConversation";
import { dummyConversations } from "@/data/chat";

const ChatPage = () => {
  const location = useLocation();
  const [conversations] = useState(dummyConversations);
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

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-[300px_1fr] h-full w-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationSelect={setSelectedConversationId}
        />
        <ChatConversation conversation={selectedConversation} />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;