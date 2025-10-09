import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KbArticle } from '@/types/kb';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const fetchKbArticles = async ({ queryKey }: { queryKey: any[] }): Promise<KbArticle[]> => {
  const [_key, _userId, { searchTerm }] = queryKey;
  const { data, error } = await supabase.rpc('get_user_kb_articles', {
    p_search_term: searchTerm || null,
  });
    
  if (error) {
    console.error('Error fetching KB articles:', error);
    toast.error('Failed to fetch articles.', { description: error.message });
    throw new Error(error.message);
  }
  
  return data as KbArticle[];
};

export const useKbArticles = (options: { searchTerm?: string } = {}) => {
  const { searchTerm } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-kb-articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kb_articles' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kb_article_tags' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['kb_articles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery<KbArticle[], Error>({
    queryKey: ['kb_articles', user?.id, { searchTerm }],
    queryFn: fetchKbArticles,
    enabled: !!user,
  });
};