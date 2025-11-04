import { useState, useEffect, useRef } from 'react';
import { Project, Comment as CommentType, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials, generatePastelColor, formatMentionsForDisplay, getAvatarUrl } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import CommentReactions from '../CommentReactions';
import CommentAttachmentItem from '../CommentAttachmentItem';
import CommentInput from '../CommentInput';

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => void;
  onUpdateComment: (project: Project, commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  isUpdatingComment?: boolean;
  updatedCommentId?: string;
  initialMention?: { id: string; name: string };
  allUsers: User[];
}

const ProjectComments = ({ project, onAddCommentOrTicket, onUpdateComment, onDeleteComment, onToggleCommentReaction, isUpdatingComment, updatedCommentId, initialMention, allUsers }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);

  useEffect(() => {
    if (initialMention && commentInputRef.current) {
      const mentionText = `@[${initialMention.name}](${initialMention.id}) `;
      commentInputRef.current.setText(mentionText, true);
      commentInputRef.current.focus();
    }
  }, [initialMention]);

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
      onUpdateComment(project, editingCommentId, editedText, null, false, []); // Simplified for now
    }
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      onDeleteComment(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <CommentInput
        ref={commentInputRef}
        project={project}
        onAddCommentOrTicket={onAddCommentOrTicket}
        allUsers={allUsers}
      />
      <div className="space-y-4 h-[300px] overflow-y-auto pr-4">
        {project.comments && project.comments.length > 0 ? (
          project.comments.map((comment: CommentType) => {
            const author = comment.author;
            const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;
            const canManageComment = user && (comment.author.id === user.id || user.role === 'admin' || user.role === 'master admin');
            const attachments = comment.attachments_jsonb || [];

            return (
              <div key={comment.id} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={getAvatarUrl(author.avatar_url, author.id)} />
                  <AvatarFallback style={generatePastelColor(author.id)}>
                    {getInitials(fullName, author.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{fullName}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: id })}
                      </span>
                      {canManageComment && editingCommentId !== comment.id && (
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
                  {editingCommentId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} autoFocus />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                          {formatMentionsForDisplay(comment.text)}
                        </ReactMarkdown>
                      </div>
                      {attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {attachments.map((file: any, index: number) => (
                            <CommentAttachmentItem key={file.id || index} file={file} />
                          ))}
                        </div>
                      )}
                      <div className="mt-2">
                        <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => onToggleCommentReaction(comment.id, emoji)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center">No comments yet. Start the discussion!</p>
        )}
      </div>
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

export default ProjectComments;