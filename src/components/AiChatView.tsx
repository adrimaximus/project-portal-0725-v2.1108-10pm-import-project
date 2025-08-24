import { useAuth } from "@/contexts/AuthContext";
import { useAiChat } from "@/hooks/useAiChat";
import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { forwardRef, useMemo, useEffect } from "react";
import { Conversation } from "@/types";
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

interface AiChatViewProps {
  onBack?: () => void;
}

const AiChatView = forwardRef<HTMLTextAreaElement, AiChatViewProps>(({ onBack }, ref) => {
  const { user: currentUser } = useAuth();
  const { conversation, isLoading, sendMessage, aiUser, isConnected, isCheckingConnection } = useAiChat(currentUser);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && typeof ref === 'object' && ref?.current) {
      const inputElement = ref.current as any;
      inputElement.value = transcript;
      if (inputElement.setText) {
        inputElement.setText(transcript);
      }
    }
  }, [transcript, ref]);

  const aiConversationObject = useMemo((): Conversation => ({
    id: 'ai-assistant',
    userName: 'AI Assistant',
    userAvatar: aiUser.avatar,
    isGroup: false,
    members: [currentUser!, aiUser],
    messages: conversation,
    lastMessage: conversation[conversation.length - 1]?.text || "Ask me anything...",
    lastMessageTimestamp: conversation[conversation.length - 1]?.timestamp || new Date().toISOString(),
    unreadCount: 0,
  }), [aiUser, conversation, currentUser]);

  if (!currentUser) return null;

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
        onReply={() => {}}
      />
      <ChatInput 
        ref={ref} 
        onSendMessage={sendMessage}
        isSending={isLoading}
        conversationId="ai-assistant"
        isListening={isListening}
        onToggleListening={isListening ? stopListening : startListening}
        isSpeechRecognitionSupported={isSupported}
        replyTo={null}
        onCancelReply={() => {}}
      />
    </div>
  );
});

export default AiChatView;