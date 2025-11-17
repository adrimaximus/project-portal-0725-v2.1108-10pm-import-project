import { supabase } from '@/integrations/supabase/client';

export const markTaskAsRead = async (taskId: string) => {
  const { error } = await supabase.rpc('mark_task_as_read', { p_task_id: taskId });
  if (error) {
    console.error('Error marking task as read:', error);
    throw error;
  }
  return null;
};