import { useState, useEffect, useRef } from 'react';
import { Project, Comment as CommentType, Task, User, ProjectFile } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Ticket, MoreHorizontal, Edit, Trash2, FileText, Paperclip, X, Loader2, SmilePlus, CornerUpLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials, generatePastelColor, parseMentions, formatMentionsForDisplay, getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import CommentInput from "../CommentInput";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import CommentAttachmentItem from '../CommentAttachmentItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CommentReactionPicker from '../CommentReactionPicker';
import { useProfiles } from '@/hooks/useProfiles';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

interface CommentWithReactions extends CommentType {
  reactions?: Reaction[];
}

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null) => void;
  onUpdateComment: (project: Project, commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  isUpdatingComment?: boolean;
  updatedCommentId?: string;
  initialMention?: { id: string; name: string } | null;
  onMentionConsumed: () => void;
  allUsers: User[];
  replyTo: CommentType | null;
  onReply: (comment: CommentType) => void;
  onCancelReply: () => void;
}

const ProjectComments = ({ project, onAddCommentOrTicket, onUpdateComment, onDeleteComment, onToggleCommentReaction, isUpdatingComment, updatedCommentId, initialMention, onMentionConsumed, allUsers, replyTo, onReply, onCancelReply }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isConvertingToTicket, setIsConvertingToTicket] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);
  const lastProcessedMentionId = useRef<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMention && commentInputRef.current && initialMention.id !== lastProcessedMentionId.current) {
      lastProcessedMentionId.current = initialMention.id;
      const mentionText = `@[${initialMention.name}](${initialMention.id}) `;
      commentInputRef.current.setText(mentionText, true);
      commentInputRef.current.focus();
      onMentionConsumed();
    }
  }, [initialMention, onMentionConsumed]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project.comments]);

  const handleEditClick = (comment: CommentType) => {
    const textWithoutAttachments = comment.text?.replace(/\n\n\*\*Attachments:\*\*[\s\S]*$/, '').trim() || '';
    setEditingCommentId(comment.id);
    setEditedText(textWithoutAttachments);
    setNewAttachments([]);
    setIsConvertingToTicket(comment.is_ticket);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
    setNewAttachments([]);
    setIsConvertingToTicket(false);
  };

  const handleSaveEdit = () => {
    if (editingCommentId) {
      const mentionedUserIds = parseMentions(editedText);
      onUpdateComment(project, editingCommentId, editedText, newAttachments, isConvertingToTicket, mentionedUserIds);
    }
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      onDeleteComment(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const comments = (project.comments || []) as CommentWithReactions[];
  const tasks = project.tasks || [];

  return (
    <div className="flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
      <div className="flex-1 overflow-y-auto pr-4 space-y-4 mb-4">
        {comments.length > 0 ? (
          comments.map((comment: CommentType) => {
            const author = comment.author;
            const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;
            const canManageComment = user && (comment.author.id === user.id || user.role === 'admin' || user.role === 'master admin');
            
            const textWithoutAttachments = comment.text?.replace(/\n\n\*\*Attachments:\*\*[\s\S]*$/, '').trim() || '';
            const mainText = textWithoutAttachments;
            
            const attachmentsData = comment.attachments_jsonb;
            const attachments: any[] = Array.isArray(attachmentsData) ? attachmentsData : attachmentsData ? [attachmentsData] : [];

            const isThisCommentBeingUpdated = isUpdatingComment && updatedCommentId === comment.id;

            const groupedReactions = (comment.reactions || []).reduce((acc, reaction) => {
              if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = { users: [], userIds: [] };
              }
              acc[reaction.emoji].users.push(reaction.user_name);
              acc[reaction.emoji].userIds.push(reaction.user_id);
              return acc;
            }, {} as Record<string, { users: string[], userIds: string[] }>);

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
                      {comment.repliedMessage && (
                        <div className="text-xs text-muted-foreground border-l-2 pl-2 mb-1">
                          <p className="font-semibold">Replying to {comment.repliedMessage.senderName}</p>
                          <p className="italic line-clamp-1">{comment.repliedMessage.content}</p>
                        </div>
                      )}
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
                          {formatMentionsForDisplay(mainText)}
                        </ReactMarkdown>
                      </div>
                      {attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {attachments.map((file: any, index: number) => (
                            <CommentAttachmentItem key={file.id || index} file={file} />
                          ))}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onReply(comment)}>
                          <CornerUpLeft className="h-3 w-3 mr-1" /> Reply
                        </Button>
                        <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => onToggleCommentReaction(comment.id, emoji)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-10">No comments yet. Start the discussion!</p>
        )}
        <div ref={commentsEndRef} />
      </div>
      <div className="flex-shrink-0 pt-4 border-t">
        <CommentInput
          ref={commentInputRef}
          project={project}
          onAddCommentOrTicket={onAddCommentOrTicket}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
        />
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