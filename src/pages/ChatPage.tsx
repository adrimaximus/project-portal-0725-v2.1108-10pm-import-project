import { useRef, useEffect } from "react";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import AiChat from "@/components/AiChat";

const ChatPageContent = () => {
  const isMobile = useIsMobile();
  const { selectedConversation, selectConversation } = useChatContext();
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedConversation && selectedConversation.id !== 'ai-assistant' && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [selectedConversation]);

  if (isMobile) {
    return (
      <div className="h-full">
        {!selectedConversation ? (
          <ChatList />
        ) : selectedConversation.id === 'ai-assistant' ? (
          <AiChat isMobile={isMobile} onBack={() => selectConversation(null)} />
        ) : (
          <ChatWindow ref={chatInputRef} onBack={() => selectConversation(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
      <ChatList />
      {selectedConversation?.id === 'ai-assistant' ? (
        <AiChat />
      ) : (
        <ChatWindow ref={chatInputRef} />
      )}
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