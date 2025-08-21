import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ArticleVotesProps {
  articleId: string;
}

const fetchVotes = async (articleId: string, userId?: string) => {
  const { data: votes, error: countError } = await supabase
    .from('kb_votes')
    .select('*', { count: 'exact' })
    .eq('article_id', articleId);

  if (countError) throw countError;

  const upvotes = votes.filter(v => v.vote_type === 1).length;
  const downvotes = votes.filter(v => v.vote_type === -1).length;
  
  let userVote: number | null = null;
  if (userId) {
    const vote = votes.find(v => v.user_id === userId);
    userVote = vote ? vote.vote_type : null;
  }

  return { total: upvotes - downvotes, userVote };
};

const ArticleVotes = ({ articleId }: ArticleVotesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: voteData } = useQuery({
    queryKey: ['articleVotes', articleId, user?.id],
    queryFn: () => fetchVotes(articleId, user?.id),
    enabled: !!articleId && !!user,
  });

  const voteMutation = useMutation({
    mutationFn: async (voteType: 1 | -1 | 0) => {
      if (!user) throw new Error("User not authenticated");

      if (voteType === 0) { // This means removing the vote
        const { error } = await supabase
          .from('kb_votes')
          .delete()
          .match({ article_id: articleId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kb_votes')
          .upsert({ article_id: articleId, user_id: user.id, vote_type: voteType }, { onConflict: 'article_id, user_id' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleVotes', articleId, user?.id] });
    },
    onError: (error: any) => {
      toast.error("Failed to cast vote.", { description: error.message });
    }
  });

  const handleVote = (type: 1 | -1) => {
    if (voteData?.userVote === type) {
      voteMutation.mutate(0); // Unvote
    } else {
      voteMutation.mutate(type);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant={voteData?.userVote === 1 ? "default" : "outline"} size="sm" onClick={() => handleVote(1)} disabled={voteMutation.isPending}>
        <ArrowUp className="h-4 w-4 mr-2" />
        Helpful
      </Button>
      <span className="font-bold text-lg w-8 text-center">{voteData?.total ?? 0}</span>
      <Button variant={voteData?.userVote === -1 ? "destructive" : "outline"} size="sm" onClick={() => handleVote(-1)} disabled={voteMutation.isPending}>
        <ArrowDown className="h-4 w-4 mr-2" />
        Not Helpful
      </Button>
    </div>
  );
};

export default ArticleVotes;