import { useState } from "react";
import { useParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { dummyConversations, dummyUsers } from "@/data/chat";
import ChatSidebar from "@/components/ChatSidebar";
import ChatView from "@/components/ChatView";
import { MessageSquare } from "lucide-react";

const ChatPage = () => {
  const { conversationId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedConversation = dummyConversations.find(
    (c) => c.id === conversationId
  );

  const getConversationWithDetails = (convo: any) => {
    const otherUserId = convo.participants.find((p: any) => p !== "user-1");
    const otherUser = dummyUsers.find((u) => u.id === otherUserId);
    const lastMessage = convo.messages[convo.messages.length - 1];
    return {
      ...convo,
      otherUser,
      lastMessage,
    };
  };

  const conversationsWithDetails = dummyConversations.map(getConversationWithDetails);

  return (
    <PortalLayout>
      <div className="flex h-full">
        <ChatSidebar
          conversations={conversationsWithDetails}
          selectedConversationId={conversationId}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col">
          {selectedConversation ? (
            <ChatView
              key={conversationId}
              conversation={getConversationWithDetails(selectedConversation)}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-muted/40 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-semibold">Select a conversation</h2>
              <p className="mt-2 text-muted-foreground">
                Choose a conversation from the list to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default ChatPage;