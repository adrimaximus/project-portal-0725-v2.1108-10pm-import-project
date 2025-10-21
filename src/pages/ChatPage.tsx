import { useRef, useEffect } from "react";
import ChatList from "@/components/ChatList";
import { ChatWindow } from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatContext } from "@/contexts/ChatContext";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

const ChatPageContent = () => {
  const isMobile = useIsMobile();
  const { selectedConversation, selectConversation, setIsChatPageActive } = useChatContext();
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsChatPageActive(true);
    return () => {
      setIsChatPageActive(false);
    };
  }, [setIsChatPageActive]);

  useEffect(() => {
    if (selectedConversation && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [selectedConversation]);

  return (
    <>
      {/* Mobile View */}
      <div className={cn("flex-1 h-full", !isMobile && "hidden")}>
        {!selectedConversation ? (
          <ChatList />
        ) : (
          <ChatWindow ref={chatInputRef} onBack={() => selectConversation(null)} />
        )}
      </div>

      {/* Desktop View */}
      <ResizablePanelGroup
        direction="horizontal"
        className={cn("flex-1 items-stretch", isMobile ? "hidden" : "flex")}
      >
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="min-w-[400px]">
          <ChatList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65}>
          <ChatWindow ref={chatInputRef} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
};

const ChatPage = () => {
  return (
    <PortalLayout noPadding disableMainScroll>
      <ChatPageContent />
    </PortalLayout>
  );
};

export default ChatPage;