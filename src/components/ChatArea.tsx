import { useChatContext } from "@/contexts/ChatContext";

const ChatArea = () => {
  const { selectedConversation } = useChatContext();

  return (
    <div className="flex flex-col h-full items-center justify-center bg-background">
      <div className="text-center p-8">
        {selectedConversation ? (
          <>
            <h2 className="text-2xl font-semibold">
              Chat with {selectedConversation.userName}
            </h2>
            <p className="text-muted-foreground">Messages will appear here.</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">Select a chat to start messaging</h2>
            <p className="text-muted-foreground">You can start a new conversation or select one from the list.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatArea;