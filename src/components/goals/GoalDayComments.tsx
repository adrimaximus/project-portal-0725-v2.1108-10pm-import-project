import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2 } from 'lucide-react';
import { getAvatarUrl, getInitials, generatePastelColor } from '@/lib/utils';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface GoalDayCommentsProps {
  goalId: string;
  date: Date;
}

const GoalDayComments = ({ goalId, date }: GoalDayCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formattedDate = date.toISOString().split('T')[0];

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('goal_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('goal_id', goalId)
      .eq('comment_date', formattedDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as any || []);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('goal-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_comments',
          filter: `goal_id=eq.${goalId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, formattedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('goal_comments')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        comment_date: formattedDate,
        content: newComment.trim()
      });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setNewComment('');
    }
    setIsLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('goal_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="flex flex-col h-[300px] border-t bg-muted/10">
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
        <h4 className="text-sm font-semibold text-muted-foreground">Comments & Notes</h4>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              No notes yet. Start the conversation!
            </div>
          ) : (
            comments.map((comment) => {
              const fullName = `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim() || comment.profiles.email || 'Unknown';
              const isOwner = user?.id === comment.user_id;
              
              return (
                <div key={comment.id} className={`flex gap-3 ${isOwner ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={getAvatarUrl(comment.profiles.avatar_url, comment.user_id)} />
                    <AvatarFallback style={generatePastelColor(comment.user_id)}>
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col max-w-[80%] ${isOwner ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">{fullName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className={`relative group p-3 rounded-lg text-sm ${
                      isOwner 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-muted text-foreground rounded-tl-none'
                    }`}>
                      {comment.content}
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t bg-background flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 h-9 text-sm"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !newComment.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default GoalDayComments;