import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, Paperclip, Ticket, X } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import MentionInput from './MentionInput';
import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from './ui/textarea';

interface ProjectCommentsProps {
  project: Project;
}

const processMentions = (text: string | null | undefined) => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '**@$1**');
};

const ProjectComments = ({ project }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isTicketMode, setIsTicketMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
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
      if (e.target.files[0].size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File is too large.', { description: 'Please select a file smaller than 5MB.' });
        return;
      }
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim() && !attachment) return;
    setIsSubmitting(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const randomFileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${project.id}/comments/${randomFileName}`;

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

    const { data: newCommentData, error: commentError } = await supabase
      .from('comments')
      .insert({
        project_id: project.id,
        author_id: user.id,
        text: comment,
        is_ticket: isTicketMode,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      })
      .select()
      .single();

    if (commentError) {
      toast.error('Failed to add comment.', { description: commentError.message });
      setIsSubmitting(false);
      return;
    }

    if (isTicketMode && newCommentData) {
      const { error: taskError } = await supabase.from('tasks').insert({
        project_id: project.id,
        created_by: user.id,
        title: comment,
        origin_ticket_id: newCommentData.id,
      });

      if (taskError) {
        toast.error('Comment created, but failed to create task.', { description: taskError.message });
      }
    }

    setComment('');
    setIsTicketMode(false);
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success(isTicketMode ? 'Ticket created successfully.' : 'Comment added.');
    queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    
    setIsSubmitting(false);
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editingComment.text.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('comments')
      .update({ text: editingComment.text })
      .eq('id', editingComment.id);

    if (error) {
      toast.error('Failed to update comment.', { description: error.message });
    } else {
      toast.success('Comment updated.');
      setEditingComment(null);
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentToDelete: Project['comments'][number]) => {
    setIsSubmitting(true);

    // If it's a ticket, delete the associated task first.
    if (commentToDelete.isTicket) {
      const ticketTask = (project.tasks || []).find(t => t.originTicketId === commentToDelete.id);
      if (ticketTask) {
        const { error: taskDeleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', ticketTask.id);

        if (taskDeleteError) {
          toast.error('Failed to delete associated task.', { description: taskDeleteError.message });
          setIsSubmitting(false);
          return;
        }
      }
    }

    // Delete the comment itself.
    const { error: commentDeleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentToDelete.id);

    if (commentDeleteError) {
      toast.error('Failed to delete comment.', { description: commentDeleteError.message });
      setIsSubmitting(false);
      return;
    }

    // Log the activity.
    const activityType = commentToDelete.isTicket ? 'TICKET_DELETED' : 'COMMENT_DELETED';
    const truncatedText = commentToDelete.text && commentToDelete.text.length > 50 
      ? `${commentToDelete.text.substring(0, 50)}...` 
      : commentToDelete.text;
    const description = `${commentToDelete.isTicket ? 'deleted a ticket' : 'deleted a comment'}: "${truncatedText}"`;

    const { error: activityError } = await supabase
      .from('project_activities')
      .insert({
        project_id: project.id,
        user_id: user.id,
        type: activityType,
        details: { description }
      });

    if (activityError) {
      toast.warning('Item deleted, but failed to log activity.');
    } else {
      toast.success(commentToDelete.isTicket ? 'Ticket deleted.' : 'Comment deleted.');
    }

    queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={isTicketMode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setIsTicketMode(!isTicketMode)}
                  disabled={isSubmitting}
                  className="text-sm font-medium"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Create a ticket
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                {attachment && (
                  <div className="flex items-center gap-2 text-sm bg-background p-1 rounded-md border">
                    <span className="pl-2">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
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

      <div className="mt-6 space-y-6">
        {(project.comments || []).map((c) => {
          const isTicket = c.isTicket;
          const ticketTask = isTicket
            ? (project.tasks || []).find(t => t.originTicketId === c.id)
            : null;
          const isOwner = user?.id === c.author.id;

          return (
            <div key={c.id} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={getAvatarUrl(c.author.avatar_url, c.author.id)} />
                <AvatarFallback>{c.author.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                  </span>
                  {isTicket && (
                    <Badge variant={ticketTask?.completed ? 'default' : 'destructive'} className={ticketTask?.completed ? 'bg-green-600 hover:bg-green-700' : ''}>
                      <Ticket className="h-3 w-3 mr-1" />
                      {ticketTask?.completed ? 'Done' : 'Ticket'}
                    </Badge>
                  )}
                </div>
                {editingComment?.id === c.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editingComment.text}
                      onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingComment(null)} disabled={isSubmitting}>Cancel</Button>
                      <Button onClick={handleUpdateComment} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {c.text && (
                      <div className="prose prose-sm dark:prose-invert max-w-none mt-1 break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
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
                          {processMentions(c.text)}
                        </ReactMarkdown>
                      </div>
                    )}
                    {c.attachment_url && c.attachment_name && (
                      <div className="mt-2">
                        <a
                          href={c.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 p-2 rounded-md transition-colors"
                        >
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{c.attachment_name}</span>
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
              {isOwner && !editingComment && (
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingComment({ id: c.id, text: c.text || '' })}>
                        Edit
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the comment.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteComment(c)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectComments;