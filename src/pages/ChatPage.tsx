import { useState } from 'react';
import ChatConversationList from '../components/ChatConversationList';
import ChatMessageArea from '../components/ChatMessageArea';
import { Collaborator } from '../types';

// Data tiruan untuk percakapan
const conversations: Collaborator[] = [
  { id: "1", name: "Jane Doe", src: "https://i.pravatar.cc/40?u=a042581f4e29026704d", fallback: "JD" },
  { id: "2", name: "John Smith", src: "https://i.pravatar.cc/40?u=a042581f4e29026705d", fallback: "JS" },
  { id: "3", name: "Peter Jones", src: "https://i.pravatar.cc/40?u=a042581f4e29026706d", fallback: "PJ" },
  { id: "4", name: "Sarah Miller", src: "https://i.pravatar.cc/40?u=a042581f4e29026707d", fallback: "SM" },
];

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<Collaborator | null>(conversations[0]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(250px,300px)_1fr] h-full border rounded-lg overflow-hidden">
      <ChatConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onConversationSelect={setSelectedConversation}
      />
      <ChatMessageArea
        conversation={selectedConversation}
      />
    </div>
  );
};

export default ChatPage;