import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, Attachment, Reaction, Collaborator, Project } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

export const fetchConversations = async (): Promise<Conversation[]> => {
  const { data, error } = await supabase.rpc('get_user_conversations');
  if (error) throw error;
  return data.map((c: any) => ({
    id: c.conversation_id,
    isGroup: c.is_group,
    userName: c.conversation_name || 'Chat',
    userAvatar: getAvatarUrl(c.conversation_avatar),
    lastMessage: c.last_message_content || "No messages yet.",
    lastMessageTimestamp: c.last_message_at,
    members: c.participants?.map((p: any) => ({
      id: p.id, name: p.name, 
      avatar_url: getAvatarUrl(p.avatar_url), 
      initials: p.initials,
    })) || [],
    created_by: c.created_by,
  }));
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase.rpc('get_conversation_messages', { p_conversation_id: conversationId });
  if (error) throw error;
  return data.map((m: any) => ({
    id: m.id,
    text: m.content,
    timestamp: m.created_at,
    sender: {
      id: m.sender_id,
      name: `${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || m.sender_email,
      avatar_url: getAvatarUrl(m.sender_avatar_url),
      initials: getInitials(`${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim(), m.sender_email),
      email: m.sender_email,
    },
    attachment: m.attachment_url ? { url: m.attachment_url, name: m.attachment_name, type: m.attachment_type } : undefined,
    reply_to_message_id: m.reply_to_message_id,
    repliedMessage: m.reply_to_message_id ? {
      content: m.replied_message_content,
      senderName: m.replied_message_sender_name,
      isDeleted: m.replied_message_is_deleted,
    } : undefined,
    isDeleted: m.is_deleted,
    reactions: m.reactions,
  }));
};

export const sendMessage = async (params: { conversationId: string, senderId: string, text: string, attachment: Attachment | null, replyToMessageId?: string | null }) => {
  const { conversationId, senderId, text, attachment, replyToMessageId } = params;
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: text,
    attachment_url: attachment?.url,
    attachment_name: attachment?.name,
    attachment_type: attachment?.type,
    reply_to_message_id: replyToMessageId,
  });
  if (error) throw error;
  return data;
};

export const createOrGetConversation = async (otherUserId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('create_or_get_conversation', { p_other_user_id: otherUserId, p_is_group: false });
  if (error) throw error;
  return data;
};

export const createGroupConversation = async (groupName: string, participantIds: string[]): Promise<string> => {
  const { data, error } = await supabase.rpc('create_group_conversation', { p_group_name: groupName, p_participant_ids: participantIds });
  if (error) throw error;
  return data;
};

export const hideConversation = async (conversationId: string) => {
  const { error } = await supabase.rpc('hide_conversation', { p_conversation_id: conversationId });
  if (error) throw error;
};

export const leaveGroup = async (conversationId: string) => {
  const { error } = await supabase.rpc('leave_group', { p_conversation_id: conversationId });
  if (error) throw error;
};

export const toggleReaction = async (messageId: string, emoji: string, userId: string) => {
  const { data: existing, error: selectError } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .single();

  if (selectError && selectError.code !== 'PGRST116') throw selectError;

  if (existing) {
    const { error: deleteError } = await supabase.from('message_reactions').delete().eq('id', existing.id);
    if (deleteError) throw deleteError;
  } else {
    const { error: insertError } = await supabase.from('message_reactions').insert({ message_id: messageId, user_id: userId, emoji });
    if (insertError) throw insertError;
  }
};

export const searchProjects = async (searchTerm: string): Promise<Pick<Project, 'id' | 'name' | 'slug'>[]> => {
  if (!searchTerm) return [];
  const { data, error } = await supabase.rpc('search_projects', { p_search_term: searchTerm });
  if (error) throw error;
  return data;
};