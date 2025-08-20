import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation, Attachment, Message } from "@/types";
import ChatPlaceholder from "./ChatPlaceholder";
import { MentionUser } from "@/components/MentionsInput";
import { useState } from "react";
import ForwardMessageDialog from "./ForwardMessageDialog";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  allConversations: Conversation[];
  onSendMessage: (text: string, attachment: Attachment | null, replyToId: string | null) => void;
  onForwardMessage: (destinationConversationId: string, message: Message) => void;
  onClearChat: (conversationId: string) => void;
  onLeaveGroup: (conversationId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onUpdate: () => void;
  onBack?: () => void;
  typing?: boolean;
  onTyping?: () => void;
}

const ChatWindow = ({ selectedConversation, allConversations, onSendMessage, onForwardMessage, onClearChat, onLeaveGroup, onDeleteMessage, onUpdate, onBack, typing, onTyping }: ChatWindowProps) => {
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  if (!selectedConversation) {
    return <ChatPlaceholder />;
  }

  const mentionUsers: MentionUser[] = (selectedConversation.members || []).map((m) => ({
    id: m.id,
    display_name: m.name,
    email: m.email,
    handle: m.email ? m.email.split("@")[0] : undefined,
  }));

  const handleForward = (destinationConversationId: string) => {
    if (messageToForward) {
      onForwardMessage(destinationConversationId, messageToForward);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ChatHeader
        selectedConversation={selectedConversation}
        onClearChat={onClearChat}
        onLeaveGroup={onLeaveGroup}
        onBack={onBack}
        typing={typing}
        onUpdate={onUpdate}
      />
      <ChatConversation
        messages={selectedConversation.messages}
        members={selectedConversation.members || []}
        onForwardMessage={setMessageToForward}
        onSetReply={setReplyingTo}
        onDeleteMessage={onDeleteMessage}
      />
      <ChatInput 
        conversationId={selectedConversation.id}
        onSendMessage={(text, attachment, replyToId) => onSendMessage(text, attachment, replyToId)}
        onTyping={onTyping}
        users={mentionUsers}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
      <ForwardMessageDialog
        open={!!messageToForward}
        onOpenChange={(isOpen) => !isOpen && setMessageToForward(null)}
        message={messageToForward}
        conversations={allConversations.filter(c => c.id !== selectedConversation.id)}
        onForward={handleForward}
      />
    </div>
  );
};

export default ChatWindow;