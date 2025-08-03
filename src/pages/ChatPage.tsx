import { useState } from "react";
import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import { dummyConversations, Conversation, Message, currentUserId } from "@/data/chat";
import { Collaborator } from "@/types";

const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>(dummyConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleSendMessage = (conversationId: string, messageText: string) => {
    const newConversations = conversations.map(convo => {
      if (convo.id === conversationId) {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: currentUserId,
          senderName: 'Alex', // Hardcoded for demo
          senderAvatar: 'https://i.pravatar.cc/150?u=alex', // Hardcoded for demo
          text: messageText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        return {
          ...convo,
          messages: [...convo.messages, newMessage],
          lastMessage: messageText,
          lastMessageTimestamp: newMessage.timestamp,
        };
      }
      return convo;
    });
    setConversations(newConversations);
  };

  const handleStartNewChat = (collaborator: Collaborator) => {
    console.log("Starting new chat with:", collaborator);
    // Di aplikasi nyata, di sini akan ada logika untuk membuat obrolan baru
  };

  const handleStartNewGroupChat = (collaborators: Collaborator[], groupName: string) => {
    console.log("Starting new group chat:", groupName, "with", collaborators);
    // Di aplikasi nyata, di sini akan ada logika untuk membuat obrolan grup baru
  };

  const getSelectedConversation = (): Conversation | null => {
    if (!selectedConversationId) return null;
    
    if (selectedConversationId === 'ai-agent') {
      // Cari di state dulu, kalau tidak ada, buat objek baru
      const existingAiConvo = conversations.find(c => c.id === 'ai-agent');
      if (existingAiConvo) return existingAiConvo;

      return {
        id: 'ai-agent',
        userName: 'AI Agent',
        userAvatar: '',
        lastMessage: 'Saya bisa bantu soal fitur & proyek.',
        lastMessageTimestamp: 'Online',
        unreadCount: 0,
        isGroup: false,
        messages: [
            {
                id: 'ai-msg-1',
                senderId: 'ai-system',
                senderName: 'AI Agent',
                senderAvatar: '',
                text: 'Halo! Saya adalah asisten AI Anda. Tanyakan apa saja tentang fitur atau proyek Anda.',
                timestamp: 'Online'
            }
        ],
      };
    }
    return conversations.find(c => c.id === selectedConversationId) || null;
  }

  return (
    <div className="grid grid-cols-[320px_1fr] h-screen bg-background">
      <ChatList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
        onStartNewChat={handleStartNewChat}
        onStartNewGroupChat={handleStartNewGroupChat}
      />
      <ChatView
        conversation={getSelectedConversation()}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatPage;