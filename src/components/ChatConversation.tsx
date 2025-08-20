import { Message, Collaborator } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useMemo } from "react";
import { isSameDay, parseISO } from 'date-fns';
import ChatMessageItem from "./ChatMessageItem";

interface ChatConversationProps {
  messages: Message[];
  members: Collaborator[];
  onForwardMessage: (message: Message) => void;
  onSetReply: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  selectionMode: boolean;
  selectedMessages: Set<string>;
  onEnterSelectionMode: (messageId: string) => void;
  onToggleMessageSelection: (messageId: string) => void;
}

const ChatConversation = ({ messages, members, selectionMode, selectedMessages, ...props }: ChatConversationProps) => {
  const { user: currentUser } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !selectionMode) {
      scrollRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages, selectionMode]);

  const messagesById = useMemo(() => new Map(messages.map(m => [m.id, m])), [messages]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showDateSeparator = !prevMessage || !isSameDay(parseISO(prevMessage.timestamp), parseISO(message.timestamp));
        const isCurrentUser = message.sender?.id === currentUser.id;
        const isSameSenderAsPrevious = prevMessage && prevMessage.sender?.id === message.sender?.id && prevMessage.message_type !== 'system_notification';
        const repliedToMessage = message.reply_to_message_id ? messagesById.get(message.reply_to_message_id) : null;
        
        return (
          <ChatMessageItem
            key={message.id || index}
            message={message}
            repliedToMessage={repliedToMessage}
            members={members}
            isCurrentUser={isCurrentUser}
            isSameSenderAsPrevious={isSameSenderAsPrevious}
            showDateSeparator={showDateSeparator}
            selectionMode={selectionMode}
            isSelected={selectedMessages.has(message.id)}
            {...props}
          />
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
};

export default ChatConversation;