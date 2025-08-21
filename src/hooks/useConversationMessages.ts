import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types';
import { getInitials } from '@/lib/utils';

const fetchMessages = async (conversationId: string): Promise<Message[]> => {
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
      sender: {
        id: m.sender_id,
        name: senderName || m.sender_email,
        avatar: m.sender_avatar_url,
        initials: getInitials(senderName, m.sender_email) || 'NN',
        email: m.sender_email,
      },
      attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
    };
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
  });
};