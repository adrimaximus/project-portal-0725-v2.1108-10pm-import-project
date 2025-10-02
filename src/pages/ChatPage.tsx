import PortalLayout from "@/components/PortalLayout";
import Chat from "@/components/chat/Chat";
import { ChatProvider } from "@/contexts/ChatContext";

const ChatPage = () => {
  return (
    <PortalLayout noPadding>
      <ChatProvider>
        <Chat />
      </ChatProvider>
    </PortalLayout>
  );
};

export default ChatPage;