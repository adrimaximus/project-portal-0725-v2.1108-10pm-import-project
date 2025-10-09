import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const fetchHasUnread = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('get_user_conversations');
  if (error) {
    console.error("Error fetching unread count:", error);
    return false;
  }
  const totalUnread = data.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  return totalUnread > 0;
};

export const useUnreadChatCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['hasUnreadChat', user?.id];

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`unread-chat-count-listener:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Invalidate if the new message is not from the current user
          if (payload.new.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Invalidate when the user's read status changes
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => fetchHasUnread(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};