import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import MentionInput from './MentionInput';
import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

interface ProjectCommentsProps {
  project: Project;
}

const ProjectComments = ({ project }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isTicketMode, setIsTicketMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  const mentionableUsers = (project.assignedTo || []).map(member => ({
    id: member.id,
    display: member.name,
    avatar_url: member.avatar_url || '',
    initials: member.initials || getInitials(member.name, member.email),
  }));

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      project_id: project.id,
      author_id: user.id,
      text: comment,
      is_ticket: isTicketMode,
    });

    if (error) {
      toast.error('Failed to add comment.', { description: error.message });
    } else {
      setComment('');
      setIsTicketMode(false);
      toast.success(isTicketMode ? 'Ticket created successfully.' : 'Comment added.');
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Comments & Tickets</h3>
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="border rounded-lg">
            <div className="p-4">
              <MentionInput
                ref={textareaRef}
                value={comment}
                onChange={setComment}
                placeholder={isTicketMode ? "Describe the ticket..." : "Add a comment... @ to mention"}
                userSuggestions={mentionableUsers}
                projectSuggestions={[]}
                disabled={isSubmitting}
                className="min-h-[100px] border-none focus-visible:ring-0 p-0"
              />
            </div>
            <div className="flex justify-between items-center p-2 border-t bg-muted/50 rounded-b-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ticket-mode"
                  checked={isTicketMode}
                  onCheckedChange={(checked) => setIsTicketMode(!!checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="ticket-mode" className="text-sm font-medium">
                  Create a ticket
                </Label>
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting || !comment.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isTicketMode ? 'Create Ticket' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {(project.comments || []).map((c) => (
          <div key={c.id} className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={getAvatarUrl(c.author.avatar_url, c.author.id)} />
              <AvatarFallback>{c.author.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none mt-1">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => {
                      const href = props.href || '';
                      if (href.startsWith('/')) {
                        return <Link to={href} {...props} className="text-primary hover:underline" />;
                      }
                      return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />;
                    }
                  }}
                >
                  {c.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectComments;