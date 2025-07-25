import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import ChatList from "@/components/ChatList";
import ChatConversation from "@/components/ChatConversation";
import { dummyConversations, Message, Conversation } from "@/data/chat";
import { Collaborator } from "@/types";

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const startOrSelectConversation = (collaborator: { name: string, avatar: string }) => {
    const existingConversation = conversations.find(c => c.userName === collaborator.name);

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
    } else {
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        userName: collaborator.name,
        userAvatar: collaborator.avatar,
        lastMessage: '',
        lastMessageTimestamp: '',
        unreadCount: 0,
        messages: [],
      };
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversationId(newConversation.id);
    }
  };

  useEffect(() => {
    const { selectedCollaborator } = location.state || {};

    if (selectedCollaborator) {
      startOrSelectConversation({ name: selectedCollaborator.name, avatar: selectedCollaborator.avatar });
      navigate(location.pathname, { replace: true, state: {} });
    } else if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [location.state, conversations, navigate, selectedConversationId]);

  const handleStartNewChat = (collaborator: Collaborator) => {
    startOrSelectConversation({ name: collaborator.name, avatar: collaborator.src });
  };

  const handleSendMessage = (conversationId: string, text: string, attachment?: File | null) => {
    const hasText = text.trim().length > 0;
    const hasAttachment = !!attachment;

    if (!hasText && !hasAttachment) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text: text.trim(),
      sender: 'me',
      timestamp: new Date().toISOString(),
    };

    if (attachment) {
      newMessage.attachment = {
        name: attachment.name,
        url: URL.createObjectURL(attachment),
        type: attachment.type,
      };
    }

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
          onStartNewChat={handleStartNewChat}
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