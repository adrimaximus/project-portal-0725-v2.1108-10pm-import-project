import { Conversation, Message, Reaction, Collaborator, ChatMessageAttachment } from '@/types/index';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const mapConversationData = (c: any): Omit<Conversation, 'messages'> => ({
  id: c.conversation_id,
  userName: c.conversation_name || 'Chat',
  userAvatar: getAvatarUrl(c.conversation_avatar, c.other_user_id || c.conversation_id),
  lastMessage: c.last_message_content || "No messages yet.",
  lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
  unreadCount: 0,
  isGroup: c.is_group,
  members: (c.participants || []).map((p: any) => ({
    id: p.id, name: p.name, 
    avatar_url: getAvatarUrl(p.avatar_url, p.id), 
    initials: p.initials,
  })),
  created_by: c.created_by,
});

export const fetchConversations = async (): Promise<Omit<Conversation, 'messages'>[]> => {
  const { data, error } = await supabase.rpc('get_user_conversations');
  if (error) {
    console.error("Error fetching conversations:", error);
    throw new Error(error.message);
  }
  return data.map(mapConversationData);
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("Message fetch error:", error);
    throw new Error(error.message);
  }

  return (data || []).map((m: any) => {
    const senderName = `${m.sender_first_name || ''} ${m.sender_last_name || ''}`.trim();
    return {
      id: m.id,
      text: m.content,
      timestamp: m.created_at,
      updated_at: m.updated_at,
      sender: {
        id: m.sender_id,
        name: senderName || m.sender_email,
        avatar_url: getAvatarUrl(m.sender_avatar_url, m.sender_id),
        initials: getInitials(senderName, m.sender_email) || 'NN',
        email: m.sender_email,
      },
      attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
      reply_to_message_id: m.reply_to_message_id,
      repliedMessage: m.reply_to_message_id ? {
        content: m.replied_message_content,
        senderName: m.replied_message_sender_name,
        isDeleted: m.replied_message_is_deleted,
        attachment: m.replied_message_attachment_url ? {
          name: m.replied_message_attachment_name,
          url: m.replied_message_attachment_url,
          type: m.replied_message_attachment_type,
        } : null,
      } : null,
      reactions: m.reactions as Reaction[],
      is_deleted: m.is_deleted,
    };
  });
};

export const sendMessage = async ({ messageId, conversationId, senderId, text, attachment, replyToMessageId }: { messageId: string, conversationId: string, senderId: string, text: string, attachment: ChatMessageAttachment | null, replyToMessageId?: string | null }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: messageId,
      conversation_id: conversationId,
      sender_id: senderId,
      content: text,
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

export const createOrGetConversation = async (otherUserId: string) => {
  const { data, error } = await supabase.rpc('create_or_get_conversation', { p_other_user_id: otherUserId, p_is_group: false });
  if (error) throw error;
  return data as string;
};

export const createGroupConversation = async (groupName: string, memberIds: string[]) => {
  const { data, error } = await supabase.rpc('create_group_conversation', { p_group_name: groupName, p_participant_ids: memberIds });
  if (error) throw error;
  return data as string;
};

export const hideConversation = async (conversationId: string) => {
  const { error } = await supabase.rpc('hide_conversation', { p_conversation_id: conversationId });
  if (error) throw error;
};

export const leaveGroup = async (conversationId: string) => {
  const { error } = await supabase.rpc('leave_group', { p_conversation_id: conversationId });
  if (error) throw error;
};

export const toggleReaction = async (messageId: string, emoji: string) => {
  const { error } = await supabase.rpc('toggle_message_reaction', {
    p_message_id: messageId,
    p_emoji: emoji,
  });
  if (error) throw error;
};

export const searchProjects = async (searchTerm: string): Promise<{ id: string, name: string, slug: string }[]> => {
  const { data, error } = await supabase.rpc('search_projects', { p_search_term: searchTerm });
  if (error) {
    console.error("Error searching projects:", error);
    return [];
  }
  return data;
};