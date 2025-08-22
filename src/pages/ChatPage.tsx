import { useRef, useEffect } from "react";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "@/hooks/useChat";

const ChatPage = () => {
  const isMobile = useIsMobile();
  const {
    conversations,
    selectedConversationId,
    isSomeoneTyping,
    searchTerm,
    setSearchTerm,
    handleConversationSelect,
    handleSendMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
    fetchConversations,
    handleLeaveGroup,
    handleDeleteConversation,
  } = useChat();
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  useEffect(() => {
    if (selectedConversationId && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [selectedConversationId]);

  if (isMobile) {
    return (
      <PortalLayout noPadding disableMainScroll>
        <div className="h-full">
          {!selectedConversation ? (
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onSelectConversation={handleConversationSelect}
              onStartNewChat={handleStartNewChat}
              onStartNewGroupChat={handleStartNewGroupChat}
              onDeleteConversation={handleDeleteConversation}
            />
          ) : (
            <ChatWindow
              ref={chatInputRef}
              selectedConversation={selectedConversation}
              onSendMessage={(text, attachment) => handleSendMessage(text, attachment)}
              onClearChat={handleClearChat}
              onLeaveGroup={handleLeaveGroup}
              onBack={() => handleConversationSelect(null)}
              typing={isSomeoneTyping}
              onTyping={sendTyping}
              onUpdate={fetchConversations}
            />
          )}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout noPadding disableMainScroll>
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSelectConversation={handleConversationSelect}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
          onDeleteConversation={handleDeleteConversation}
        />
        <ChatWindow
          ref={chatInputRef}
          selectedConversation={selectedConversation}
          onSendMessage={(text, attachment) => handleSendMessage(text, attachment)}
          onClearChat={handleClearChat}
          onLeaveGroup={handleLeaveGroup}
          typing={isSomeoneTyping}
          onTyping={sendTyping}
          onUpdate={fetchConversations}
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;