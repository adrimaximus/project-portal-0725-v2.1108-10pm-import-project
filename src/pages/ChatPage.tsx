import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import { ChatProvider } from "@/contexts/ChatContext";
import PortalLayout from "@/components/PortalLayout";

const ChatPage = () => {
  return (
    <PortalLayout>
      <ChatProvider>
        <div className="grid grid-cols-[300px_1fr] md:grid-cols-[350px_1fr] h-full border rounded-lg overflow-hidden shadow-sm bg-card">
          <ChatList />
          <ChatView />
        </div>
      </ChatProvider>
    </PortalLayout>
  );
};

export default ChatPage;