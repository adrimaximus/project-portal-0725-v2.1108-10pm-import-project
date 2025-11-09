import React, { useState, useEffect } from 'react';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatConversation } from '@/components/ChatConversation';
import ChatInput from '@/components/ChatInput';
import { Message, Collaborator } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Dummy data for demonstration
const dummyMembers: Collaborator[] = [
  { id: '1', name: 'You', initials: 'Y', email: 'you@example.com' },
  { id: '2', name: 'Jane Doe', initials: 'JD', email: 'jane@example.com' },
  { id: 'ai-assistant', name: 'AI Assistant', initials: 'AI' },
];

const dummyMessages: Message[] = [
  {
    id: 'msg1',
    sender: dummyMembers[1],
    text: 'Hey, how is the project going?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'msg2',
    sender: dummyMembers[0],
    text: 'Going well! Almost done with the chat UI.',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'msg3',
    sender: dummyMembers[1],
    text: 'Great! Can you show me how to edit a message?',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
];

const ChatPageContent = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(dummyMessages);
  const [members, setMembers] = useState<Collaborator[]>(dummyMembers);

  // Replace dummy user ID with current user's ID
  useEffect(() => {
    if (user) {
      setMembers(prev => prev.map(m => m.id === '1' ? { ...m, id: user.id, name: 'You' } : m));
      setMessages(prev => prev.map(msg => msg.sender.id === '1' ? { ...msg, sender: { ...msg.sender, id: user.id, name: 'You' } } : msg));
    }
  }, [user]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-lg font-semibold">Chat</h1>
      </header>
      <ChatConversation messages={messages} members={members} />
      <ChatInput />
    </div>
  );
};

const ChatPage = () => {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
};

export default ChatPage;