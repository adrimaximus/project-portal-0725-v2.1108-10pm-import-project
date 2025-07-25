import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import ChatList from "@/components/ChatList";
import ChatConversation from "@/components/ChatConversation";
import { dummyConversations } from "@/data/chat";

const ChatPage = () => {
  const [conversations] = useState(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(dummyConversations[0]?.id || null);

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