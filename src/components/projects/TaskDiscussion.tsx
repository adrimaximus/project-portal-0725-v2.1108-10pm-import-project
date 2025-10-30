import { useState, useMemo } from 'react';
import { Task, Comment as CommentType, User } from "@/types";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import CommentInput from '../CommentInput';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { getInitials, generatePastelColor, formatMentionsForDisplay, getAvatarUrl, cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import CommentAttachmentItem from '../CommentAttachmentItem';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import CommentReactions from '../CommentReactions';

interface TaskDiscussionProps {
  task: Task;
  onToggleReaction: (emoji: string) => void;
}

const TaskDiscussion = ({ task, onToggleReaction }: TaskDiscussionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['task-comments', task.id],
    queryFn: async () => {
      if (!task.id) return [];
      const { data, error } = await supabase
        .rpc('get_task_comments', { p_task_id: task.id });
      if (error) throw error;
      return data as CommentType[];
    },
    enabled: !!task.id,
  });

  const { data: projectTasks } = useQuery({
    queryKey: ['project-tasks-tickets', task.project_id],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('id, completed, origin_ticket_id')
            .eq('project_id', task.project_id)
            .not('origin_ticket_id', 'is', null);
        if (error) throw error;
        return data;
    },
    enabled: !!task.project_id,
  });

  const ticketTaskStatusMap = useMemo(() => {
    if (!projectTasks) return new Map<string, boolean>();
    const map = new Map<string, boolean>();
    for (const t of projectTasks) {
        if (t.origin_ticket_id) {
            map.set(t.origin_ticket_id, t.completed);
        }
    }
    return map;
  }, [projectTasks]);

  const groupedComments = useMemo(() => {
    if (!comments || comments.length === 0) return [];

    const groups: { author: User, messages: CommentType[] }[] = [];
    let currentGroup: { author: User, messages: CommentType[] } | null = null;

    for (const comment of comments) {
      const timeDiff = currentGroup ? new Date(comment.created_at).getTime() - new Date(currentGroup.messages[currentGroup.messages.length - 1].created_at).getTime() : Infinity;
      const fiveMinutes = 5 * 60 * 1000;

      if (currentGroup && currentGroup.author.id === comment.author_id && timeDiff < fiveMinutes) {
        currentGroup.messages.push(comment);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          author: comment.author as User,
          messages: [comment],
        };
      }
    }
    if (currentGroup) {
      groups.push(currentGroup);
    }
    return groups;
  }, [comments]);

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, attachments, mentionedUserIds, isTicket }: { text: string, attachments: File[] | null, mentionedUserIds: string[], isTicket: boolean }) => {
      if (!user) throw new Error("User not authenticated");

      let attachmentsJsonb: any[] = [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${task.project_id}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) {
            throw new Error(`Failed to get public URL for ${file.name}.`);
          }
          
          return { 
            id: fileId,
            file_name: file.name, 
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            created_at: new Date().toISOString(),
          };
        });
        attachmentsJsonb = await Promise.all(uploadPromises);
      }

      const { data: newComment, error: commentError } = await supabase.from('comments').insert({
        project_id: task.project_id,
        task_id: task.id,
        author_id: user.id,
        text: text,
        is_ticket: isTicket,
        attachments_jsonb: attachmentsJsonb,
      }).select().single();

      if (commentError) throw commentError;
      if (!newComment) throw new Error("Failed to create comment.");

      if (isTicket) {
        const { error: taskError } = await supabase.from('tasks').insert({
          project_id: task.project_id,
          title: text,
          created_by: user.id,
          origin_ticket_id: newComment.id,
          status: 'To do',
        });

        if (taskError) {
          await supabase.from('comments').delete().eq('id', newComment.id);
          throw taskError;
        }
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isTicket ? "Ticket created." : "Comment added.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      if (variables.isTicket) {
        queryClient.invalidateQueries({ queryKey: ['project-tasks-tickets', task.project_id] });
        queryClient.invalidateQueries({ queryKey: ['project-tasks', task.project_id] });
        queryClient.invalidateQueries({ queryKey: ['project'] });
      }
    },
    onError: (error: any) => toast.error("Failed to add comment/ticket.", { description: error.message }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string, text: string }) => {
      const { error } = await supabase.from('comments').update({ text }).eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment updated.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to update comment.", { description: error.message }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment deleted.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to delete comment.", { description: error.message }),
  });

  const toggleCommentReactionMutation = useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string, emoji: string }) => {
      const { error } = await supabase.rpc('toggle_comment_reaction', { p_comment_id: commentId, p_emoji: emoji });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to update reaction.", { description: error.message }),
  });

  const handleAddComment = (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    addCommentMutation.mutate({ text, isTicket, attachments, mentionedUserIds });
  };

  const handleEditClick = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditedText(comment.text || '');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
  };

  const handleSaveEdit = () => {
    if (editingCommentId) {
      updateCommentMutation.mutate({ commentId: editingCommentId, text: editedText });
    }
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      deleteCommentMutation.mutate(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const handleToggleCommentReaction = (commentId: string, emoji: string) => {
    toggleCommentReactionMutation.mutate({ commentId, emoji });
  };

  return (
    <div>
      <h4 className="font-semibold mb-4">Discussion</h4>
      <div className="space-y-4 pr-2 pb-4">
        {isLoadingComments ? <p>Loading comments...</p> : groupedComments.map((group, groupIndex) => {
          const author = group.author;
          const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;

          return (
            <div key={groupIndex} className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={getAvatarUrl(author.avatar_url, author.id)} />
                <AvatarFallback style={generatePastelColor(author.id)}>
                  {getInitials(fullName, author.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{fullName}</p>
                <div className="space-y-1 mt-1">
                  {group.messages.map(comment => {
                    const canManageComment = user && (comment.author_id === user.id || user.role === 'admin' || user.role === 'master admin');
                    const attachments = comment.attachments_jsonb || [];
                    const isTicket = comment.is_ticket;
                    const taskCompleted = isTicket ? ticketTaskStatusMap.get(comment.id) : undefined;

                    return (
                      <div key={comment.id} className="group relative">
                        {editingCommentId === comment.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} autoFocus />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                {isTicket && (
                                  <span className="mt-1 font-mono select-none text-muted-foreground text-lg leading-tight">
                                    {taskCompleted ? '☑' : '☐'}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  {comment.text && (
                                    <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", taskCompleted && "line-through text-muted-foreground")}>
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
                                        {formatMentionsForDisplay(comment.text)}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                  {attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {attachments.map((file: any, index: number) => (
                                        <CommentAttachmentItem key={file.id || index} file={file} />
                                      ))}
                                    </div>
                                  )}
                                  <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => handleToggleCommentReaction(comment.id, emoji)} />
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0 self-start flex items-center gap-1">
                              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                {format(new Date(comment.created_at), 'p')}
                              </span>
                              {canManageComment && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => handleEditClick(comment)}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setCommentToDelete(comment)} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <CommentInput project={task as any} onAddCommentOrTicket={handleAddComment} />
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskDiscussion;