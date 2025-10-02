import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, Attachment } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

const mapApiConversation = (c: any): Conversation => ({
  id: c.conversation_id,
  name: c.conversation_name || 'Chat',
  avatar: getAvatarUrl(c.conversation_avatar, c.other_user_id || c.conversation_id),
  is_group: c.is_group,
  participants: c.participants,
  last_message_content: c.last_message_content,
  last_message_at: c.last_message_at,
  created_by: c.created_by,
});

export const fetchConversations = async (): Promise<Conversation[]> => {
  const { data, error } = await supabase.rpc('get_user_conversations');
  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
  return data.map(mapApiConversation);
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    p_conversation_id: conversationId,
  });
  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
  return data.map((m: any) => ({
    ...m,
    sender: {
      id: m.sender_id,
      name: `${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || m.sender_email,
      avatar_url: m.sender_avatar_url,
      email: m.sender_email,
      initials: getInitials(`${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || m.sender_email),
    }
  }));
};

export const sendMessage = async (conversationId: string, content: string, senderId: string, attachment?: Attachment, replyToMessageId?: string): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content,
      sender_id: senderId,
      attachment_url: attachment?.url,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
      reply_to_message_id: replyToMessageId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const searchMessages = async (searchTerm: string): Promise<string[]> => {
  const { data, error } = await supabase.rpc('search_conversations', { p_search_term: searchTerm });
  if (error) {
    console.error('Error searching messages:', error);
    return [];
  }
  return data.map((r: any) => r.conversation_id);
};