import { useChat } from "@/contexts/ChatContext";
import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Message } from "@/types";

const ChatWindow = () => {
  const { selectedConversation, messages, loading, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedConversation]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!selectedConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <img src="/chat-placeholder.svg" alt="Select a chat" className="w-64 h-64" />
        <h2 className="text-2xl font-semibold mt-4">Select a conversation</h2>
        <p className="text-muted-foreground">Choose from your existing conversations to start chatting.</p>
      </div>
    );
  }

  const handleSendMessage = async (content: string, attachment?: File) => {
    setIsSending(true);
    try {
      await sendMessage(content, attachment, replyTo || undefined);
      setReplyTo(null);
    } catch (error: any) {
      toast.error("Failed to send message: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <ChatConversation
          messages={messages[selectedConversation.id] || []}
          members={selectedConversation.participants || []}
          onReply={setReplyTo}
        />
      </div>
      <div className="p-4 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
};

export default ChatWindow;