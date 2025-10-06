import { supabase } from '@/integrations/supabase/client';
import { DbConversation, DbMessage, Conversation, Message, Attachment, User } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

const mapMessageData = (m: DbMessage): Message => {
  const sender: User = {
    id: m.sender_id,
    name: `${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || m.sender_email || 'Unknown User',
    email: m.sender_email || '',
    avatar_url: m.sender_avatar_url || null,
    initials: getInitials(`${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || m.sender_email || 'UU'),
  };

  return {
    id: m.id,
    conversation_id: m.conversation_id,
    sender,
    text: m.content,
    timestamp: m.created_at,
    message_type: m.message_type,
    is_deleted: m.is_deleted,
    is_forwarded: m.is_forwarded,
    attachment: m.attachment_url ? {
      name: m.attachment_name || 'Attachment',
      url: m.attachment_url,
      type: m.attachment_type || 'application/octet-stream',
      size: 0, // Note: size is not available from this query
    } : undefined,
    repliedMessage: m.reply_to_message_id ? {
      content: m.replied_message_content || '',
      senderName: m.replied_message_sender_name || 'Unknown User',
      isDeleted: m.replied_message_is_deleted || false,
    } : undefined,
  };
};

const mapConversationData = (c: DbConversation): Omit<Conversation, 'messages' | 'unreadCount'> => ({
  id: c.conversation_id,
  userName: c.conversation_name || 'Chat',
  userAvatar: c.conversation_avatar,
  isGroup: c.is_group,
  members: c.participants,
  lastMessage: c.last_message_content,
  lastMessageTimestamp: c.last_message_at,
  created_by: c.created_by,
});

export const fetchConversations = async (): Promise<Omit<Conversation, 'messages' | 'unreadCount'>[]> => {
  const { data, error } = await supabase.rpc('get_user_conversations');
  if (error) throw error;
  return data.map(mapConversationData);
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase.rpc('get_conversation_messages', { p_conversation_id: conversationId });
  if (error) throw error;
  return data.map(mapMessageData);
};

export const searchConversationsByMessage = async (searchTerm: string): Promise<string[]> => {
  if (!searchTerm) return [];
  const { data, error } = await supabase.rpc('search_conversations', { p_search_term: searchTerm });
  if (error) throw error;
  return data.map((c: { conversation_id: string }) => c.conversation_id);
};