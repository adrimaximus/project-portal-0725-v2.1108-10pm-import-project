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
    handleConversationSelect,
    handleSendMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
  } = useChat();

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  if (isMobile) {
    return (
      <PortalLayout noPadding disableMainScroll>
        <div className="h-full">
          {!selectedConversation ? (
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleConversationSelect}
              onStartNewChat={handleStartNewChat}
              onStartNewGroupChat={handleStartNewGroupChat}
            />
          ) : (
            <ChatWindow
              selectedConversation={selectedConversation}
              onSendMessage={(text, attachment) => handleSendMessage(text, attachment)}
              onClearChat={handleClearChat}
              onBack={() => handleConversationSelect(null)}
              typing={isSomeoneTyping}
              onTyping={sendTyping}
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
          onSelectConversation={handleConversationSelect}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
        />
        <ChatWindow
          selectedConversation={selectedConversation}
          onSendMessage={(text, attachment) => handleSendMessage(text, attachment)}
          onClearChat={handleClearChat}
          typing={isSomeoneTyping}
          onTyping={sendTyping}
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;