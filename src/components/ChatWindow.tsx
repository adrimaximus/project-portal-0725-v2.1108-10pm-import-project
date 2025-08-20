import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Conversation, Attachment, Message } from "@/types";
import ChatPlaceholder from "./ChatPlaceholder";
import { MentionUser } from "@/components/MentionsInput";
import { useState, useCallback } from "react";
import ForwardMessageDialog from "./ForwardMessageDialog";
import ChatSelectionBar from "./ChatSelectionBar";
import { toast } from "sonner";

interface ChatWindowProps {
  selectedConversation: Conversation | null;
  allConversations: Conversation[];
  onSendMessage: (text: string, attachment: Attachment | null, replyToId: string | null) => void;
  onForwardMessages: (destinationConversationId: string, messages: Message[]) => void;
  onClearChat: (conversationId: string) => void;
  onLeaveGroup: (conversationId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onUpdate: () => void;
  onBack?: () => void;
  typing?: boolean;
  onTyping?: () => void;
}

const ChatWindow = ({ selectedConversation, allConversations, onSendMessage, onForwardMessages, onClearChat, onLeaveGroup, onDeleteMessage, onUpdate, onBack, typing, onTyping }: ChatWindowProps) => {
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  const handleEnterSelectionMode = useCallback((initialMessageId: string) => {
    setSelectionMode(true);
    setSelectedMessages(new Set([initialMessageId]));
  }, []);

  const handleToggleMessageSelection = useCallback((messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      if (newSet.size === 0) {
        setSelectionMode(false);
      }
      return newSet;
    });
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedMessages(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    selectedMessages.forEach(id => onDeleteMessage(id));
    handleCancelSelection();
  }, [selectedMessages, onDeleteMessage, handleCancelSelection]);

  const handleForwardSelected = useCallback(() => {
    if (!selectedConversation) return;
    const selected = selectedConversation.messages.filter(m => selectedMessages.has(m.id));
    if (selected.length > 0) {
      setMessagesToForward(selected);
    } else {
      toast.info("No messages selected to forward.");
    }
    handleCancelSelection();
  }, [selectedMessages, selectedConversation, handleCancelSelection]);

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
    if (messagesToForward.length > 0) {
      onForwardMessages(destinationConversationId, messagesToForward);
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
        onForwardMessage={(message) => setMessagesToForward([message])}
        onSetReply={setReplyingTo}
        onDeleteMessage={onDeleteMessage}
        selectionMode={selectionMode}
        selectedMessages={selectedMessages}
        onEnterSelectionMode={handleEnterSelectionMode}
        onToggleMessageSelection={handleToggleMessageSelection}
      />
      {selectionMode ? (
        <ChatSelectionBar
          selectedCount={selectedMessages.size}
          onCancel={handleCancelSelection}
          onDelete={handleDeleteSelected}
          onForward={handleForwardSelected}
        />
      ) : (
        <ChatInput 
          conversationId={selectedConversation.id}
          onSendMessage={(text, attachment, replyToId) => onSendMessage(text, attachment, replyToId)}
          onTyping={onTyping}
          users={mentionUsers}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      )}
      <ForwardMessageDialog
        open={messagesToForward.length > 0}
        onOpenChange={(isOpen) => !isOpen && setMessagesToForward([])}
        messages={messagesToForward}
        conversations={allConversations.filter(c => c.id !== selectedConversation.id)}
        onForward={handleForward}
      />
    </div>
  );
};

export default ChatWindow;