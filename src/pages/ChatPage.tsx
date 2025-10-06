import { useRef, useEffect } from "react";
import ChatList from "@/components/ChatList";
import { ChatWindow } from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1 items-stretch"
    >
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <ChatList />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <ChatWindow ref={chatInputRef} />
      </ResizablePanel>
    </ResizablePanelGroup>
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