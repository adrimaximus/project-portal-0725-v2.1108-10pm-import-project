import { useAuth } from "@/contexts/AuthContext";
import useAiChat from "@/hooks/useAiChat";
import { forwardRef, useMemo, useState } from "react";
import { Conversation, Message } from "@/types";
import { Link } from 'react-router-dom';
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AiChatView = forwardRef<HTMLDivElement>((props, ref) => {
  const { user: currentUser } = useAuth();
  const { conversation, isLoading, sendMessage, aiUser } = useAiChat(currentUser);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (text: string, attachment?: File) => {
    setIsSending(true);
    try {
      await sendMessage(text, attachment, replyTo || undefined);
      setReplyTo(null);
    } catch (error: any) {
      toast.error("AI Error: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const aiConversation: Conversation = useMemo(() => ({
    id: 'ai-assistant',
    name: 'AI Assistant',
    avatar: aiUser.avatar_url,
    is_group: false,
    participants: [currentUser!, aiUser],
    created_by: 'system',
    messages: conversation,
    last_message_content: conversation[conversation.length - 1]?.content || "Ask me anything...",
    last_message_at: conversation[conversation.length - 1]?.timestamp || new Date().toISOString(),
  }), [conversation, currentUser, aiUser]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto" ref={ref}>
        <div className="p-4 text-sm text-center bg-blue-50 border-b border-blue-200 text-blue-800">
          This is an AI assistant. Responses may be inaccurate. For critical tasks, please verify with a human. For project-related queries, you can also visit the <Link to="/projects" className="underline font-semibold">Projects Page</Link>.
        </div>
        <ChatConversation
          messages={conversation}
          members={[currentUser!, aiUser]}
          isLoading={isLoading}
          onReply={setReplyTo}
        />
      </div>
      <div className="p-4 border-t bg-background">
        <ChatInput
          onSendMessage={handleSendMessage}
          isSending={isSending || isLoading}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          placeholder="Ask the AI assistant..."
        />
        {isLoading && (
          <div className="flex items-center justify-center pt-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            AI is thinking...
          </div>
        )}
      </div>
    </div>
  );
});

export default AiChatView;