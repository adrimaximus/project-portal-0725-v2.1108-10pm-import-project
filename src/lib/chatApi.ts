import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, Attachment, Reaction, Collaborator } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

export const mapToConversation = (c: any): Conversation => ({
  id: c.conversation_id,
  isGroup: c.is_group,
  name: c.conversation_name || 'Chat',
  userAvatar: getAvatarUrl({ avatar_url: c.conversation_avatar, id: c.other_user_id || c.conversation_id }),
  lastMessage: c.last_message_content || "No messages yet.",
  lastMessageAt: c.last_message_at ? new Date(c.last_message_at) : new Date(),
  otherUserId: c.other_user_id,
  participants: c.participants?.map((p: any) => ({
    id: p.id, name: p.name, 
    avatar_url: getAvatarUrl(p), 
    initials: p.initials,
  })) || [],
  createdBy: c.created_by,
});

export const mapToMessage = (m: any): Message => {
  const attachments: Attachment[] = [];
  if (m.attachment_url) {
    attachments.push({
      url: m.attachment_url,
      name: m.attachment_name,
      type: m.attachment_type,
    });
  }

  const reactions: Reaction[] = m.reactions?.map((r: any) => ({
    emoji: r.emoji,
    userId: r.user_id,
    userName: r.user_name,
  })) || [];

  const senderName = [m.sender_first_name, m.sender_last_name].filter(Boolean).join(' ');

  return {
    id: m.id,
    conversationId: m.conversation_id,
    content: m.content,
    createdAt: new Date(m.created_at),
    attachments,
    reactions,
    type: m.message_type,
    replyTo: m.reply_to_message_id ? {
      id: m.reply_to_message_id,
      content: m.replied_message_content,
      senderName: m.replied_message_sender_name,
      isDeleted: m.replied_message_is_deleted,
    } : undefined,
    isDeleted: m.is_deleted,
    isForwarded: m.is_forwarded,
    sender: {
      id: m.sender_id,
      name: senderName || m.sender_email,
      avatar_url: getAvatarUrl({ avatar_url: m.sender_avatar_url, id: m.sender_id }),
      initials: getInitials(senderName) || 'NN',
      email: m.sender_email,
    },
  };
};