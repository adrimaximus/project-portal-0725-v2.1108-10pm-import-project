import { useState } from "react";
import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import { conversations as initialConversations, Conversation } from "@/data/chat";
import { Collaborator } from "@/types";
import PortalLayout from "@/components/PortalLayout";

const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleStartNewChat = (collaborator: Collaborator) => {
    const existingConversation = conversations.find(
      (c) => c.userName === collaborator.name && !c.isGroup
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      return;
    }

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      userName: collaborator.name,
      userAvatar: collaborator.avatar,
      lastMessage: "You can now start the conversation.",
      lastMessageTimestamp: "Just now",
      unreadCount: 0,
      messages: [],
      isGroup: false,
    };

    setConversations([newConversation, ...conversations]);
    setSelectedConversationId(newConversation.id);
  };

  const handleStartNewGroupChat = (groupName: string, members: Collaborator[]) => {
    const newGroupConversation: Conversation = {
      id: `group-${Date.now()}`,
      userName: groupName,
      userAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`,
      lastMessage: `Group created with ${members.length} members.`,
      lastMessageTimestamp: "Just now",
      unreadCount: 0,
      messages: [],
      isGroup: true,
      members: members,
    };

    setConversations([newGroupConversation, ...conversations]);
    setSelectedConversationId(newGroupConversation.id);
  };

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr] h-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
        />
        <ChatView conversation={selectedConversation} />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;