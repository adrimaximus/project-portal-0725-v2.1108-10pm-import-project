import { useState, useMemo } from 'react';
import { Task, Comment as CommentType, User } from "@/types";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import CommentInput from '../CommentInput';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { getInitials, generatePastelColor, formatMentionsForDisplay, getAvatarUrl } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Ticket, Paperclip } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import CommentAttachmentItem from '../CommentAttachmentItem';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import CommentReactions from '../CommentReactions';
import CommentReactionPicker from '../CommentReactionPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const groupedComments = useMemo(() => {
    if (!comments || comments.length === 0) return [];

    const groups: { author: User; comments: CommentType[] }[] = [];
    let currentGroup: { author: User; comments: CommentType[] } | null = null;

    comments.forEach(comment => {
      if (currentGroup && currentGroup.author.id === comment.author.id) {
        currentGroup.comments.push(comment);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          author: comment.author as User,
          comments: [comment],
        };
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [comments]);

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, attachments, mentionedUserIds }: { text: string, attachments: File[] | null, mentionedUserIds: string[] }) => {
      if (!user) throw new Error("User not authenticated");

      let finalCommentText = text;
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

      const { error } = await supabase.from('comments').insert({
        project_id: task.project_id,
        task_id: task.id,
        author_id: user.id,
        text: finalCommentText,
        is_ticket: false,
        attachments_jsonb: attachmentsJsonb,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment added.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to add comment.", { description: error.message }),
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
    addCommentMutation.mutate({ text, attachments, mentionedUserIds });
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
      <div className="space-y-2 pr-2 pb-4">
        {isLoadingComments ? <p>Loading comments...</p> : groupedComments.map((group, groupIndex) => {
          const author = group.author;
          const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;

          return (
            <div key={`${author.id}-${groupIndex}`} className="flex items-start space-x-4">
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                <AvatarImage src={getAvatarUrl(author.avatar_url, author.id)} />
                <AvatarFallback style={generatePastelColor(author.id)}>
                  {getInitials(fullName, author.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{fullName}</p>
                <div>
                  {group.comments.map(comment => {
                    const canManageComment = user && (comment.author.id === user.id || user.role === 'admin' || user.role === 'master admin');
                    const attachments = comment.attachments_jsonb || [];

                    return (
                      <div key={comment.id} className="group relative -ml-2 -mr-2 px-2 py-1 rounded-md hover:bg-muted/50">
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} autoFocus />
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                {comment.text && (
                                  <div className="prose prose-sm dark:prose-invert max-w-none break-words">
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
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                                <TooltipProvider>
                                  {comment.isTicket && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Ticket className="h-4 w-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>This comment is a ticket</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {attachments.length > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Paperclip className="h-4 w-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{`${attachments.length} attachment(s)`}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </TooltipProvider>
                                <span>
                                  {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                </span>
                                <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => handleToggleCommentReaction(comment.id, emoji)} />
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <CommentReactionPicker onSelect={(emoji) => handleToggleCommentReaction(comment.id, emoji)} />
                                  </div>
                                  {canManageComment && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6">
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
                            </div>
                            {attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {attachments.map((file: any, index: number) => (
                                  <CommentAttachmentItem key={file.id || index} file={file} />
                                ))}
                              </div>
                            )}
                          </>
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