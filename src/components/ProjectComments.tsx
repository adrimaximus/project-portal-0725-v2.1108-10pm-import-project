import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, X } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import MentionInput from './MentionInput';
import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProjectCommentsProps {
  project: Project;
}

const ProjectComments = ({ project }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isTicketMode, setIsTicketMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const mentionableUsers = (project.assignedTo || []).map(member => ({
    id: member.id,
    display: member.name,
    avatar_url: member.avatar_url || '',
    initials: member.initials || getInitials(member.name, member.email),
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File is too large.', { description: 'Maximum file size is 10MB.' });
        return;
      }
      setAttachment(e.target.files[0]);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!comment.trim() && !attachment) return;
    setIsSubmitting(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${project.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, attachment);

      if (uploadError) {
        toast.error('Failed to upload attachment.', { description: uploadError.message });
        setIsSubmitting(false);
        return;
      }

      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);
      
      attachmentUrl = data.publicUrl;
      attachmentName = attachment.name;
    }

    const { error } = await supabase.from('comments').insert({
      project_id: project.id,
      author_id: user.id,
      text: comment,
      is_ticket: isTicketMode,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    });

    if (error) {
      toast.error('Failed to add comment.', { description: error.message });
    } else {
      setComment('');
      setIsTicketMode(false);
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="ghost" size="icon" onClick={handleAttachmentClick} disabled={isSubmitting} aria-label="Add attachment">
                  <Paperclip className="h-4 w-4" />
                </Button>
                {attachment && (
                  <div className="flex items-center gap-2 text-sm bg-background/50 p-1 rounded-md">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[150px] truncate">{attachment.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)} disabled={isSubmitting}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting || (!comment.trim() && !attachment)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isTicketMode ? 'Create Ticket' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[500px] mt-6">
        <div className="space-y-6 pr-4">
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
                  {c.attachment_url && (
                    <div className="mt-2">
                      <a
                        href={c.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline not-prose"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{c.attachment_name}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectComments;