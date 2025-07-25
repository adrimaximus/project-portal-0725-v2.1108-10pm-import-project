import { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { dummyConversations, Conversation, Message } from '@/data/chat';

interface ChatContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  handleSendMessage: (conversationId: string, text: string, attachment?: File | null) => void;
  selectConversation: (collaborator: { name: string; avatar: string }) => void;
  getConversationById: (id: string | null) => Conversation | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>(dummyConversations);
  const navigate = useNavigate();

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
          ? { 
              ...convo, 
              messages: [...convo.messages, newMessage],
              lastMessage: text.trim() || attachment?.name || 'Attachment',
              lastMessageTimestamp: new Date().toISOString(),
              unreadCount: 0 
            }
          : convo
      )
    );
  };

  const selectConversation = (collaborator: { name: string; avatar: string }) => {
    const existingConversation = conversations.find(c => c.userName === collaborator.name);
    let targetId: string;

    if (existingConversation) {
      targetId = existingConversation.id;
    } else {
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        userName: collaborator.name,
        userAvatar: collaborator.avatar,
        lastMessage: 'Percakapan dimulai.',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };
      setConversations(prev => [newConversation, ...prev]);
      targetId = newConversation.id;
    }
    
    navigate('/chat', { state: { selectedConversationId: targetId } });
  };

  const totalUnreadCount = conversations.reduce((sum, convo) => sum + convo.unreadCount, 0);
  
  const getConversationById = (id: string | null): Conversation | null => {
    if (!id) return null;
    return conversations.find(c => c.id === id) || null;
  }

  const value = { 
    conversations, 
    totalUnreadCount, 
    handleSendMessage, 
    selectConversation,
    getConversationById
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};