import { useState } from "react";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { dummyConversations, Conversation, Message } from "@/data/chat";
import { Collaborator } from "@/types";

const ChatPage = () => {
  const [conversations, setConversations] =
    useState<Conversation[]>(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(dummyConversations[0]?.id || null);

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleSendMessage = (messageText: string, file?: File) => {
    if (!selectedConversationId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
      senderName: "You",
      senderAvatar: "https://i.pravatar.cc/150?u=me",
    };

    if (file) {
      newMessage.attachment = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'file',
      };
    }

    const lastMessage = messageText || `Sent an attachment: ${file?.name}`;

    setConversations((prev) =>
      prev.map((convo) =>
        convo.id === selectedConversationId
          ? {
              ...convo,
              messages: [...convo.messages, newMessage],
              lastMessage: lastMessage,
              lastMessageTimestamp: newMessage.timestamp,
            }
          : convo
      )
    );
  };

  const handleStartNewChat = (collaborator: Collaborator) => {
    const existingConversation = conversations.find(
      (convo) => !convo.isGroup && convo.members?.some(m => m.id === collaborator.id)
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      return;
    }

    const newConversation: Conversation = {
      id: collaborator.id,
      userName: collaborator.name,
      userAvatar: collaborator.src,
      lastMessage: "Say hello!",
      lastMessageTimestamp: "Just now",
      unreadCount: 0,
      messages: [],
      isGroup: false,
      members: [collaborator]
    };

    setConversations((prev) => [newConversation, ...prev]);
    setSelectedConversationId(newConversation.id);
  };

  const handleStartNewGroupChat = (
    members: Collaborator[],
    groupName: string
  ) => {
    const newConversation: Conversation = {
      id: `group-${Date.now()}`,
      userName: groupName,
      lastMessage: "Group created. Say hello!",
      lastMessageTimestamp: "Just now",
      unreadCount: 0,
      messages: [
        {
          id: `msg-${Date.now()}`,
          text: `Group "${groupName}" was created.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: "me",
          senderName: "System",
          senderAvatar: "",
        },
      ],
      isGroup: true,
      members: members,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setSelectedConversationId(newConversation.id);
  };

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
        />
        <ChatWindow
          selectedConversation={selectedConversation}
          onSendMessage={handleSendMessage}
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;