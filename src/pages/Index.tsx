import { useState } from 'react';
import { ChatConversation } from '@/components/ChatConversation';
import { ChatInput } from '@/components/ChatInput';
import { Message, Collaborator } from '@/types';

// Dummy data for demonstration
const dummyMembers: Collaborator[] = [
  { id: '1', name: 'You', email: 'you@example.com', avatar_url: '', initials: 'Y' },
  { id: '2', name: 'John Doe', email: 'john@example.com', avatar_url: '', initials: 'JD' },
];

const dummyMessages: Message[] = [
  {
    id: 'msg1',
    sender: { id: '2', name: 'John Doe', avatar_url: '', initials: 'JD' },
    text: 'Hey, how are you?',
    timestamp: new Date().toISOString(),
    reactions: [],
  },
  {
    id: 'msg2',
    sender: { id: '1', name: 'You', avatar_url: '', initials: 'Y' },
    text: 'kjfadsfjakfjafa',
    timestamp: new Date().toISOString(),
    reactions: [],
  },
];

const IndexPage = () => {
  const [messages, setMessages] = useState<Message[]>(dummyMessages);
  const user = { id: '1' }; // Dummy auth

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: `msg${messages.length + 1}`,
      sender: { id: user.id, name: 'You', avatar_url: '', initials: 'Y' },
      text,
      timestamp: new Date().toISOString(),
      reactions: [],
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleReply = (message: Message) => {
    console.log('Replying to:', message);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Chat</h1>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatConversation messages={messages} members={dummyMembers} onReply={handleReply} />
        <ChatInput onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
};

export default IndexPage;