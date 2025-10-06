import { useRef, useEffect } from "react";
import ChatList from "@/components/ChatList";
import { ChatWindow } from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";

const ChatPageContent = () => {
  const isMobile = useIsMobile();
  const { selectedConversation, selectConversation } = useChatContext();
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedConversation && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [selectedConversation]);

  if (isMobile) {
    return (
      <div className="flex-1 h-full">
        {!selectedConversation ? (
          <ChatList />
        ) : (
          <ChatWindow ref={chatInputRef} onBack={() => selectConversation(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] flex-1 overflow-hidden">
      <ChatList />
      <ChatWindow ref={chatInputRef} />
    </div>
  );
};

const ChatPage = () => {
  return (
    <PortalLayout noPadding disableMainScroll>
      <ChatProvider>
        <ChatPageContent />
      </ChatProvider>
    </PortalLayout>
  );
};

export default ChatPage;