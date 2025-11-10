import React, { useState, useRef } from 'react';
import { Comment as CommentType, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials, formatMentionsForDisplay } from '@/lib/utils';
import { Button } from './ui/button';
import { MoreHorizontal, Edit, Trash2, Ticket, CornerUpLeft, Paperclip, X, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import CommentReactions from './CommentReactions';
import CommentAttachmentItem from './CommentAttachmentItem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useCommentManager } from '@/hooks/useCommentManager';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner';

interface CommentProps {
  comment: CommentType;
  onReply: (comment: CommentType) => void;
  onGoToReply?: (messageId: string) => void;
}

const Comment: React.FC<CommentProps> = ({ comment, onReply, onGoToReply }) => {
  const { user } = useAuth();
  const { updateComment, deleteComment, toggleReaction } = useCommentManager({ scope: { projectId: comment.project_id, taskId: comment.task_id } });

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const author = comment.author as User;
  const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || author.email;
  const formattedText = formatMentionsForDisplay(comment.text || '');
  const attachmentsData = comment.attachments_jsonb;
  const attachments: any[] = Array.isArray(attachmentsData) ? attachmentsData : attachmentsData ? [attachmentsData] : [];

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedText(comment.text || '');
    setNewAttachments([]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText('');
    setNewAttachments([]);
  };

  const handleSaveEdit = () => {
    updateComment.mutate({ commentId: comment.id, text: editedText, attachments: newAttachments });
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    deleteComment.mutate(comment.id);
    setIsDeleteDialogOpen(false);
  };

  const handleToggleReaction = (emoji: string) => {
    toggleReaction.mutate({ commentId: comment.id, emoji });
  };

  const handleCreateTicketFromComment = () => {
    updateComment.mutate({ commentId: comment.id, text: comment.text || '', isTicket: true }, {
      onSuccess: () => {
        toast.success("Comment converted to ticket.");
      }
    });
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div id={`message-${comment.id}`} className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={getAvatarUrl(author.avatar_url, author.id)} />
          <AvatarFallback style={generatePastelColor(author.id)}>
            {getInitials(authorName, author.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: id })}
              </span>
              {comment.is_ticket && <Badge variant="outline">from ticket</Badge>}
            </div>
            {user && user.id === author.id && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {isEditing ? (
            <div className="mt-1 space-y-2">
              <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="text-sm" />
              {(attachments.length > 0 || (newAttachments && newAttachments.length > 0)) && (
                <div className="mt-2">
                    <h4 className="font-semibold text-xs text-muted-foreground mb-2">Attachments</h4>
                    <div className="space-y-1">
                        {attachments.map((file, index) => (
                            <div key={file.url || file.file_url || index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>{file.name || file.file_name}</span>
                            </div>
                        ))}
                        {newAttachments && newAttachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-muted p-1 rounded-md">
                            <span className="truncate">{file.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeNewAttachment(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => editFileInputRef?.current?.click()}>
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Attach files</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <input type="file" ref={editFileInputRef} multiple onChange={handleEditFileChange} className="hidden" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {comment.repliedMessage && (
                <button
                  onClick={() => onGoToReply && comment.reply_to_message_id && onGoToReply(comment.reply_to_message_id)}
                  className="w-full text-left flex items-start gap-2 text-xs p-2 mb-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                  disabled={!onGoToReply || !comment.reply_to_message_id}
                >
                  <div className="w-0.5 bg-primary rounded-full self-stretch"></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-primary">Replying to {comment.repliedMessage.senderName}</p>
                    <div className="italic line-clamp-1 prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {formatMentionsForDisplay(comment.repliedMessage.content || '')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </button>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none break-all">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formattedText}</ReactMarkdown>
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file: any, index: number) => (
                    <CommentAttachmentItem key={file.id || index} file={file} />
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-1 text-xs" onClick={() => onReply(comment)}>
                  <CornerUpLeft className="h-3 w-3 mr-1" /> Reply
                </Button>
                <CommentReactions reactions={comment.reactions || []} onToggleReaction={handleToggleReaction} />
                {!comment.is_ticket && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-1 text-xs" onClick={handleCreateTicketFromComment}>
                    <Ticket className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Create Ticket</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment. If this is a ticket, the associated task will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Comment;