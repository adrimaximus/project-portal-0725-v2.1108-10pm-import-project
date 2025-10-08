import { supabase } from '@/integrations/supabase';
import { Conversation, Message, Attachment, Reaction, Collaborator } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

export const mapToConversation = (c: any): Conversation => ({
  id: c.conversation_id,
  isGroup: c.is_group,
  userName: c.conversation_name || 'Chat',
  userAvatar: getAvatarUrl(c.conversation_avatar || c.other_user_id || c.conversation_id),
  lastMessage: c.last_message_content || "No messages yet.",
  lastMessageAt: c.last_message_at,
  otherUserId: c.other_user_id,
  participants: c.participants?.map((p: any) => ({
    id: p.id, name: p.name, 
    avatar_url: getAvatarUrl(p.avatar_url), 
    initials: p.initials,
  })) || [],
  createdBy: c.created_by,
});

export const mapToMessage = (m: any): Message => {
  const senderName = [m.sender_first_name, m.sender_last_name].filter(Boolean).join(' ');
  const repliedMessageSenderName = m.replied_message_sender_name;

  return {
    id: m.id,
    conversationId: m.conversation_id,
    sender: {
      id: m.sender_id,
      name: senderName || m.sender_email,
      avatar_url: getAvatarUrl(m.sender_avatar_url),
      initials: getInitials(senderName, m.sender_email) || 'NN',
    },
    content: m.content,
    createdAt: m.created_at,
    attachment: m.attachment_url ? {
      url: m.attachment_url,
      name: m.attachment_name,
      type: m.attachment_type,
    } : undefined,
    type: m.message_type,
    replyTo: m.reply_to_message_id ? {
      id: m.reply_to_message_id,
      content: m.replied_message_content,
      senderName: repliedMessageSenderName,
      isDeleted: m.replied_message_is_deleted,
    } : undefined,
    isDeleted: m.is_deleted,
    isForwarded: m.is_forwarded,
    reactions: m.reactions?.map((r: any) => ({
      emoji: r.emoji,
      userId: r.user_id,
      userName: r.user_name,
    })) || [],
  };
};