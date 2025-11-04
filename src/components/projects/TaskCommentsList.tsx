import React from 'react';
import { Comment as CommentType, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { getInitials, generatePastelColor, formatMentionsForDisplay, getAvatarUrl } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Ticket, Paperclip, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import CommentReactions from '../CommentReactions';
import CommentAttachmentItem from '../CommentAttachmentItem';
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface TaskCommentsListProps {
  comments: CommentType[];
  isLoading: boolean;
  onEdit: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  editingCommentId: string | null;
  editedText: string;
  setEditedText: (text: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  newAttachments: File[];
  removeNewAttachment: (index: number) => void;
  handleEditFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editFileInputRef: React.RefObject<HTMLInputElement>;
}

const TaskCommentsList = ({
  comments,
  isLoading,
  onEdit,
  onDelete,
  onToggleReaction,
  editingCommentId,
  editedText,
  setEditedText,
  handleSaveEdit,
  handleCancelEdit,
  newAttachments,
  removeNewAttachment,
  handleEditFileChange,
  editFileInputRef,
}: TaskCommentsListProps) => {
  const { user } = useAuth();
  const commentsEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  if (isLoading) {
    return <p>Loading comments...</p>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold mb-4">Discussion</h4>
      <div className="space-y-4">
        {comments.map(comment => {
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{fullName}</p>
                    {comment.isTicket && (
                      <Ticket className="h-4 w-4 text-muted-foreground" title="Created as ticket" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {canManageComment && editingCommentId !== comment.id && (
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
                </div>
                {editingCommentId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} autoFocus />
                    {(attachments.length > 0 || newAttachments.length > 0) && (
                      <div className="mt-2">
                          <h4 className="font-semibold text-xs text-muted-foreground mb-2">Attachments</h4>
                          <div className="space-y-1">
                              {attachments.map((file, index) => (
                                  <div key={file.url || file.file_url || index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <FileText className="h-4 w-4" />
                                      <span>{file.name || file.file_name}</span>
                                  </div>
                              ))}
                              {newAttachments.map((file, index) => (
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
                      <Button variant="ghost" size="icon" onClick={() => editFileInputRef.current?.click()}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <input type="file" ref={editFileInputRef} multiple onChange={handleEditFileChange} className="hidden" />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                      </div>
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
                      <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
};

export default TaskCommentsList;