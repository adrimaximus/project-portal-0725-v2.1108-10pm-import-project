import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types';

export const fetchConversations = async (): Promise<Conversation[]> => {
  const { data, error } = await supabase.rpc('get_user_conversations');
  if (error) throw error;
  return data.map((c: any) => ({
    id: c.conversation_id,
    isGroup: c.is_group,
    name: c.conversation_name,
    avatarUrl: c.conversation_avatar,
    lastMessage: c.last_message_content,
    lastMessageAt: c.last_message_at,
    otherUserId: c.other_user_id,
    participants: c.participants,
    createdBy: c.created_by,
    unreadCount: c.unread_count,
    messages: [],
    userName: c.conversation_name,
    last_message_at: c.last_message_at,
  }));
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
  return data.map((m: any) => ({
    id: m.id,
    text: m.content,
    createdAt: m.created_at,
    sender: {
      id: m.sender_id,
      name: `${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim() || m.sender_email,
      avatarUrl: m.sender_avatar_url,
    },
    attachment: m.attachment_url ? {
      name: m.attachment_name,
      url: m.attachment_url,
      type: m.attachment_type,
    } : undefined,
    replyTo: m.reply_to_message_id ? {
      id: m.reply_to_message_id,
      text: m.replied_message_content,
      senderName: m.replied_message_sender_name,
      isDeleted: m.replied_message_is_deleted,
      attachment: m.replied_message_attachment_url ? {
        name: m.replied_message_attachment_name,
        url: m.replied_message_attachment_url,
        type: m.replied_message_attachment_type,
      } : undefined,
    } : undefined,
    isDeleted: m.is_deleted,
    isForwarded: m.is_forwarded,
    reactions: m.reactions,
  }));
};

export const createOrGetConversation = async (otherUserId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('create_or_get_conversation', {
    p_other_user_id: otherUserId,
    p_is_group: false,
  });
  if (error) throw error;
  return data;
};

export const createGroupConversation = async (groupName: string, participantIds: string[]): Promise<string> => {
  const { data, error } = await supabase.rpc('create_group_conversation', {
    p_group_name: groupName,
    p_participant_ids: participantIds,
  });
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
  const { data: existing, error: fetchError } = await supabase
    .from('message_reactions')
    .select('id, emoji')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existing) {
    if (existing.emoji === emoji) {
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
      if (deleteError) throw deleteError;
    } else {
      const { error: updateError } = await supabase
        .from('message_reactions')
        .update({ emoji })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji });
    if (insertError) throw insertError;
  }
};