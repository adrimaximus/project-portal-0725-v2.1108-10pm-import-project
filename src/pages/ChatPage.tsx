import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { dummyConversations, Conversation, Message } from "@/data/chat";
import { Collaborator, Attachment, User } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

const ChatPage = () => {
  const [conversations, setConversations] =
    useState<Conversation[]>(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!isMobile) {
      setSelectedConversationId(dummyConversations[0]?.id || null);
    }
  }, [isMobile]);

  useEffect(() => {
    if (location.state?.selectedCollaborator) {
      const collaborator = location.state.selectedCollaborator as Collaborator;
      
      setConversations(prevConvos => {
        const existingConversation = prevConvos.find(
          (convo) => !convo.isGroup && convo.members?.some(m => m.id === collaborator.id)
        );

        if (existingConversation) {
          return prevConvos;
        }

        const newConversation: Conversation = {
          id: `conv-${collaborator.id}`,
          userName: collaborator.name,
          userAvatar: collaborator.avatar,
          lastMessage: "Say hello!",
          lastMessageTimestamp: "Just now",
          unreadCount: 0,
          messages: [],
          isGroup: false,
          members: [collaborator]
        };
        
        return [newConversation, ...prevConvos];
      });

      const conversationId = `conv-${collaborator.id}`;
      setSelectedConversationId(conversationId);

      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleSendMessage = (conversationId: string, messageText: string, attachment: Attachment | null) => {
    if (!conversationId || !currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: currentUser,
      attachment: attachment || undefined,
    };

    const lastMessage = messageText || `Sent an attachment: ${attachment?.name}`;

    setConversations((prev) =>
      prev.map((convo) =>
        convo.id === conversationId
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
    navigate('/chat', { state: { selectedCollaborator: collaborator } });
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
          sender: { id: 'system', name: 'System', initials: 'S' },
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

  if (isMobile) {
    return (
      <PortalLayout noPadding>
        <div className="h-full">
          {!selectedConversation ? (
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleConversationSelect}
              onStartNewChat={handleStartNewChat}
              onStartNewGroupChat={handleStartNewGroupChat}
            />
          ) : (
            <ChatWindow
              selectedConversation={selectedConversation}
              onSendMessage={(text, attachment) => handleSendMessage(selectedConversation.id, text, attachment)}
              onBack={() => setSelectedConversationId(null)}
            />
          )}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleConversationSelect}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
        />
        <ChatWindow
          selectedConversation={selectedConversation}
          onSendMessage={(text, attachment) => handleSendMessage(selectedConversationId!, text, attachment)}
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;