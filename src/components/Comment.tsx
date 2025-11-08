import React from 'react';
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

interface CommentProps {
  comment: CommentType;
  onEdit: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  isEditing: boolean;
  editedText: string;
  setEditedText: (text: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  onReply: (comment: CommentType) => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
  newAttachments?: File[];
  removeNewAttachment?: (index: number) => void;
  handleEditFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editFileInputRef?: React.RefObject<HTMLInputElement>;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onEdit,
  onDelete,
  onToggleReaction,
  isEditing,
  editedText,
  setEditedText,
  handleSaveEdit,
  handleCancelEdit,
  onReply,
  onCreateTicketFromComment,
  newAttachments,
  removeNewAttachment,
  handleEditFileChange,
  editFileInputRef,
}) => {
  const { user } = useAuth();
  
  const author = comment.author as User;
  const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || author.email;
  const formattedText = formatMentionsForDisplay(comment.text || '');
  const attachmentsData = comment.attachments_jsonb;
  const attachments: any[] = Array.isArray(attachmentsData) ? attachmentsData : attachmentsData ? [attachmentsData] : [];

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={getAvatarUrl(author.avatar_url, author.id)} />
        <AvatarFallback style={generatePastelColor(author.id)}>
          {getInitials(authorName, author.email)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
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
                <DropdownMenuItem onSelect={() => onEdit(comment)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(comment)} className="text-destructive">
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
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeNewAttachment && removeNewAttachment(index)}>
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
              <div className="text-xs text-muted-foreground border-l-2 pl-2 mb-1">
                <p className="font-semibold">Replying to {comment.repliedMessage.senderName}</p>
                <div className="italic line-clamp-1 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {formatMentionsForDisplay(comment.repliedMessage.content || '')}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
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
              <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onReply(comment)}>
                <CornerUpLeft className="h-3 w-3 mr-1" /> Reply
              </Button>
              <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)} />
              {!comment.is_ticket && (
                <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onCreateTicketFromComment(comment)}>
                  <Ticket className="h-3 w-3 mr-1" /> Create Ticket
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Comment;