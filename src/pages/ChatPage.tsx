import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import { ChatProvider } from "@/contexts/ChatContext";

const ChatPage = () => {
  return (
    <ChatProvider>
      <div className="grid grid-cols-[300px_1fr] md:grid-cols-[350px_1fr] h-screen">
        <ChatList />
        <ChatView />
      </div>
    </ChatProvider>
  );
};

export default ChatPage;