import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.selectedCollaborator) {
      const collaborator = location.state.selectedCollaborator as Collaborator;
      
      // Use a functional update to get the latest state and prevent race conditions.
      setConversations(prevConvos => {
        const existingConversation = prevConvos.find(
          (convo) => !convo.isGroup && convo.members?.some(m => m.id === collaborator.id)
        );

        if (existingConversation) {
          // If chat exists, we don't need to update the conversations list.
          return prevConvos;
        }

        // If chat does not exist, create a new one.
        const newConversation: Conversation = {
          id: `conv-${collaborator.id}`, // Use a predictable ID
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

      // After ensuring the conversation exists, select it.
      // We can find it using the predictable ID.
      const conversationId = `conv-${collaborator.id}`;
      setSelectedConversationId(conversationId);

      // Clear state to prevent re-triggering on refresh
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
    // Instead of complex logic here, just navigate with state.
    // The useEffect hook will handle the creation and selection.
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