import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ArticleCommentsProps {
  articleId: string;
}

type CommentWithAuthor = {
  id: string;
  content: string;
  created_at: string;
  profiles: { first_name: string, last_name: string, avatar_url: string } | null;
};

const fetchComments = async (articleId: string) => {
  const { data, error } = await supabase
    .from('kb_comments')
    .select('*, profiles ( first_name, last_name, avatar_url )')
    .eq('article_id', articleId)
    .is('parent_comment_id', null) // Only top-level comments for now
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as CommentWithAuthor[];
};

const ArticleComments = ({ articleId }: ArticleCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['articleComments', articleId],
    queryFn: () => fetchComments(articleId),
    enabled: !!articleId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("You must be logged in to comment.");
      const { error } = await supabase
        .from('kb_comments')
        .insert({ article_id: articleId, author_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleComments', articleId] });
      setNewComment("");
      toast.success("Comment added.");
    },
    onError: (error: any) => {
      toast.error("Failed to add comment.", { description: error.message });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
      {user && (
        <form onSubmit={handleSubmit} className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={addCommentMutation.isPending}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={addCommentMutation.isPending || !newComment.trim()}>
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </form>
      )}
      <div className="space-y-4">
        {isLoading && <p>Loading comments...</p>}
        {comments.map(comment => (
          <div key={comment.id} className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={comment.profiles?.avatar_url} />
              <AvatarFallback>{comment.profiles?.first_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{comment.profiles?.first_name} {comment.profiles?.last_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: id })}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleComments;