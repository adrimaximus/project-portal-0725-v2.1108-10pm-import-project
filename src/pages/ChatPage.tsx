import { useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedId = searchParams.get('highlight');

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

  const onHighlightComplete = () => {
    searchParams.delete('highlight');
    setSearchParams(searchParams, { replace: true });
  };

  if (isMobile) {
    return (
      <div className="flex-1 h-full">
        {!selectedConversation ? (
          <ChatList highlightedId={highlightedId} onHighlightComplete={onHighlightComplete} />
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
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="min-w-[400px]">
        <ChatList highlightedId={highlightedId} onHighlightComplete={onHighlightComplete} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65}>
        <ChatWindow ref={chatInputRef} />
      </ResizablePanel>
    </ResizablePanelGroup>
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