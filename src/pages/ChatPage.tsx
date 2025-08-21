import { useRef, useEffect } from "react";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "@/hooks/useChat";
import { useConversationMessages } from "@/hooks/useConversationMessages";

const ChatPage = () => {
  const isMobile = useIsMobile();
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    isSomeoneTyping,
    searchTerm,
    setSearchTerm,
    handleSendMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
    fetchConversations,
    handleLeaveGroup,
    handleDeleteConversation,
  } = useChat();
  
  const { data: messages = [] } = useConversationMessages(selectedConversationId);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  
  const conversationWithMessages = selectedConversation ? {
    ...selectedConversation,
    messages: messages,
  } : null;

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
              onSelectConversation={setSelectedConversationId}
              onStartNewChat={handleStartNewChat}
              onStartNewGroupChat={handleStartNewGroupChat}
              onDeleteConversation={handleDeleteConversation}
            />
          ) : (
            <ChatWindow
              ref={chatInputRef}
              selectedConversation={conversationWithMessages}
              onSendMessage={(text, attachment) => handleSendMessage(text, attachment)}
              onClearChat={handleClearChat}
              onLeaveGroup={handleLeaveGroup}
              onBack={() => setSelectedConversationId(null)}
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
          onSelectConversation={setSelectedConversationId}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
          onDeleteConversation={handleDeleteConversation}
        />
        <ChatWindow
          ref={chatInputRef}
          selectedConversation={conversationWithMessages}
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