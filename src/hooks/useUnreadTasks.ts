import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const fetchUnreadTaskIds = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_unread_task_ids');
  if (error) {
    console.error('Error fetching unread task IDs:', error);
    return [];
  }
  return data.map((item: { task_id: string }) => item.task_id);
};

export const useUnreadTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['unreadTaskIds', user?.id];

  const { data: unreadTaskIds = [], ...queryInfo } = useQuery({
    queryKey,
    queryFn: fetchUnreadTaskIds,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:tasks-comments-for-unread')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  return { unreadTaskIds, ...queryInfo };
};