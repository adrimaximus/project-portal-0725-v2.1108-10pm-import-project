import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import ContentLayout from "@/components/ContentLayout";
import { dummyConversations, Conversation, Message } from "@/data/chat";
import { Collaborator } from "@/types";
import { dummyProjects } from "@/data/projects";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatPage = () => {
  const [conversations, setConversations] =
    useState<Conversation[]>(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
          userAvatar: collaborator.src,
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

  if (isMobile) {
    return (
      <ContentLayout noPadding>
        <div className="h-full">
          {!selectedConversation ? (
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              onStartNewChat={handleStartNewChat}
              onStartNewGroupChat={handleStartNewGroupChat}
            />
          ) : (
            <ChatWindow
              selectedConversation={selectedConversation}
              onSendMessage={handleSendMessage}
              projects={dummyProjects}
              onBack={() => setSelectedConversationId(null)}
            />
          )}
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout noPadding>
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
          projects={dummyProjects}
        />
      </div>
    </ContentLayout>
  );
};

export default ChatPage;