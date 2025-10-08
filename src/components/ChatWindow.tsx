import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { Message, Conversation } from '@/types';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';
import { Mention } from 'primereact/mention';

interface ChatWindowProps {
  conversation: Conversation;
}

const ChatWindow = forwardRef<Mention, ChatWindowProps>(({ conversation }, ref) => {
  const { user } = useAuth();
  const { addMessage, updateMessage } = useChatContext();
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const handleSendMessage = async (text: string, attachment: File | null, replyToMessageId: string | null) => {
    if (!user || !conversation) return;
    if (!text.trim() && !attachment) return;

    setIsSending(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;

    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${conversation.conversation_id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, attachment);

      if (uploadError) {
        toast.error(`Failed to upload attachment: ${uploadError.message}`);
        setIsSending(false);
        return;
      }

      const { data } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);
      attachmentUrl = data.publicUrl;
      attachmentName = attachment.name;
      attachmentType = attachment.type;
    }

    const tempId = `temp_${Date.now()}`;
    const messageData = {
      id: tempId,
      conversation_id: conversation.conversation_id,
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      reply_to_message_id: replyToMessageId,
      isSending: true,
      sender_first_name: user.first_name,
      sender_last_name: user.last_name,
      sender_avatar_url: user.avatar_url,
      sender_email: user.email,
    };

    addMessage(conversation.conversation_id, messageData);
    setReplyTo(null);

    const { data: insertedMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.conversation_id,
        sender_id: user.id,
        content: text,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        reply_to_message_id: replyToMessageId,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Failed to send message: ${error.message}`);
      updateMessage(conversation.conversation_id, tempId, { isSending: false, error: true });
    } else {
      updateMessage(conversation.conversation_id, tempId, { ...insertedMessage, isSending: false });
    }

    setIsSending(false);
  };

  const handleTyping = () => {
    if (conversation) {
      const channel = supabase.channel(`chat:${conversation.conversation_id}`);
      channel.track({
        event: 'typing',
        user_id: user?.id,
        user_name: user?.first_name,
      });
    }
  };

  const handleSetReplyTo = (message: Message) => {
    setReplyTo(message);
    if (ref && 'current' in ref && ref.current) {
      const input = ref.current.getInput() as HTMLTextAreaElement;
      if (input) input.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList 
        messages={conversation.messages || []} 
        onReply={handleSetReplyTo}
      />
      <ChatInput
        ref={ref}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isSending={isSending}
        conversationId={conversation.conversation_id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
});

export default ChatWindow;