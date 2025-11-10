import { useAuth } from "@/contexts/AuthContext";
import { useAiChat } from "@/hooks/useAiChat";
import ChatHeader from "./ChatHeader";
import { ChatConversation } from "./ChatConversation";
import { ChatInput } from "./ChatInput";
import { forwardRef, useMemo, useState } from "react";
import { Conversation, Message } from "@/types";
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';

interface AiChatViewProps {
  onBack?: () => void;
}

const AiChatView = forwardRef<HTMLTextAreaElement, AiChatViewProps>(({ onBack }, ref) => {
  const { user: currentUser } = useAuth();
  const { conversation, isLoading, sendMessage, aiUser, isConnected, isCheckingConnection } = useAiChat(currentUser);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const aiConversationObject = useMemo((): Conversation => {
    const members = currentUser ? [currentUser, aiUser] : [aiUser];
    return {
      id: 'ai-assistant',
      userName: 'AI Assistant',
      userAvatar: aiUser.avatar_url,
      isGroup: false,
      members: members,
      messages: conversation,
      lastMessage: conversation[conversation.length - 1]?.text || "Ask me anything...",
      lastMessageTimestamp: conversation[conversation.length - 1]?.timestamp || new Date().toISOString(),
      unreadCount: 0,
      created_by: 'ai-assistant',
    };
  }, [aiUser, conversation, currentUser]);

  const handleSendMessage = (text: string, attachmentFile: File | null) => {
    sendMessage(text, attachmentFile, replyTo?.id);
    setReplyTo(null);
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <ChatHeader onBack={onBack} conversation={aiConversationObject} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isCheckingConnection) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <ChatHeader onBack={onBack} conversation={aiConversationObject} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <ChatHeader onBack={onBack} conversation={aiConversationObject} />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">AI Assistant is Offline</h3>
              <p className="text-sm text-muted-foreground mt-2">
                An administrator needs to configure the OpenAI integration in the settings to enable the AI Assistant.
              </p>
              <Button asChild className="mt-4">
                <Link to="/settings/integrations/openai">Go to Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        onBack={onBack}
        conversation={aiConversationObject}
      />
      <ChatConversation
        messages={conversation}
        members={[currentUser, aiUser]}
        isLoading={isLoading}
        onReply={setReplyTo}
      />
      <ChatInput 
        ref={ref} 
        onSendMessage={handleSendMessage}
        isSending={isLoading}
        conversationId="ai-assistant"
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={null}
        onCancelEdit={() => {}}
      />
    </div>
  );
});

export default AiChatView;