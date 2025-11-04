import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Project, Comment as CommentType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProjectDiscussionProps {
  project: Project;
}

const ProjectDiscussion = ({ project }: ProjectDiscussionProps) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const mentionId = searchParams.get('mention');
    const mentionName = searchParams.get('mentionName');

    if (mentionId && mentionName) {
      const mentionText = `@[${mentionName}](${mentionId}) `;
      setComment(prev => prev ? `${prev} ${mentionText}` : mentionText);
      
      commentInputRef.current?.focus();

      // Clean up URL params
      searchParams.delete('mention');
      searchParams.delete('mentionName');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async () => {
    if (!comment.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      project_id: project.id,
      author_id: user.id,
      text: comment,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to post comment.', { description: error.message });
    } else {
      toast.success('Comment posted.');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Comments List */}
          <div className="space-y-4">
            {project.comments && project.comments.length > 0 ? (
              project.comments.map((c: CommentType) => (
                <div key={c.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(c.author.avatar_url, c.author.id)} />
                    <AvatarFallback style={generatePastelColor(c.author.id)}>
                      {getInitials(c.author.name, c.author.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">No comments yet. Start the discussion!</p>
            )}
          </div>

          {/* Comment Input */}
          <div className="flex items-start gap-3">
            {user && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                <AvatarFallback style={generatePastelColor(user.id)}>
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 space-y-2">
              <Textarea
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment... Use @ to mention team members."
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={isSubmitting || !comment.trim()}>
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDiscussion;