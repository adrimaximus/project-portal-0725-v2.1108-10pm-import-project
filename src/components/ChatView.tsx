import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Profile } from '@/types';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatViewProps {
  conversationId: string;
  participants: Profile[];
}

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ChatView = ({ conversationId, participants }: ChatViewProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .rpc('get_conversation_messages', { p_conversation_id: conversationId });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      const formattedMessages = data.map((msg: any) => {
        const senderName = `${msg.sender_first_name || ''} ${msg.sender_last_name || ''}`.trim() || msg.sender_email;
        return {
          id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.created_at),
          sender: {
            id: msg.sender_id,
            name: senderName,
            avatar_url: msg.sender_avatar_url,
            initials: getInitials(senderName),
          },
          attachmentUrl: msg.attachment_url,
          attachmentName: msg.attachment_name,
          attachmentType: msg.attachment_type,
          messageType: msg.message_type,
          replyTo: msg.reply_to_message_id ? {
            id: msg.reply_to_message_id,
            text: msg.replied_message_content,
            senderName: msg.replied_message_sender_name,
            isDeleted: msg.replied_message_is_deleted,
          } : null,
          isDeleted: msg.is_deleted,
        };
      });
      setMessages(formattedMessages);
    };

    fetchMessages();

    const channel = supabase.channel(`messages:${conversationId}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, 
      (payload) => {
        const newMessageData = payload.new;
        const senderProfile = participants.find(p => p.id === newMessageData.sender_id);
        const senderName = senderProfile ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email : 'Unknown User';
        
        const newMessage: Message = {
          id: newMessageData.id,
          text: newMessageData.content,
          createdAt: new Date(newMessageData.created_at),
          sender: {
            id: newMessageData.sender_id,
            name: senderName,
            avatar_url: senderProfile?.avatar_url,
            initials: getInitials(senderName),
          },
          attachmentUrl: newMessageData.attachment_url,
          attachmentName: newMessageData.attachment_name,
          attachmentType: newMessageData.attachment_type,
          messageType: newMessageData.message_type,
          replyTo: null, // Simplified for real-time, full context can be fetched if needed
          isDeleted: newMessageData.is_deleted,
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // Play notification sound for incoming messages
        if (user && newMessage.sender.id !== user.id) {
          const prefs = user.notification_preferences;
          const chatSoundPref = prefs?.comment; // 'comment' is the id for chat messages
          if (chatSoundPref?.enabled && chatSoundPref?.sound && chatSoundPref.sound !== 'None') {
            const { data: { publicUrl } } = supabase.storage
              .from('General')
              .getPublicUrl(`Notification/${chatSoundPref.sound}`);
            
            if (publicUrl) {
              const audio = new Audio(publicUrl);
              audio.play().catch(e => console.error("Error playing notification sound:", e));
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, participants, user]);

  const handleSendMessage = async (text: string, attachment: File | null, replyToMessageId: string | null) => {
    if (!user) return;
    setIsSending(true);

    let attachment_url = null;
    let attachment_name = null;
    let attachment_type = null;

    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, attachment);

      if (uploadError) {
        console.error('Error uploading attachment:', uploadError);
        toast.error("Failed to upload attachment.");
        setIsSending(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);
      
      attachment_url = urlData.publicUrl;
      attachment_name = attachment.name;
      attachment_type = attachment.type;
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
      attachment_url,
      attachment_name,
      attachment_type,
      reply_to_message_id: replyToMessageId,
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message.");
    }
    setIsSending(false);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} onReply={handleReply} />
      </div>
      <ChatInput
        ref={textareaRef}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        conversationId={conversationId}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
};