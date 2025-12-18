import React, { useState, useMemo } from 'react';
import { Comment as CommentType, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials, cn } from '@/lib/utils';
import { Button } from './ui/button';
import { MoreHorizontal, Edit, Trash2, Ticket, CornerUpLeft, Paperclip, X, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import CommentReactions from './CommentReactions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import AttachmentViewerModal from './AttachmentViewerModal';
import MarkdownRenderer from './MarkdownRenderer';
import { MentionsInput, Mention } from 'react-mentions';
import '@/styles/mentions.css';

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
  onGoToReply?: (messageId: string) => void;
  allUsers: User[];
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
  onGoToReply,
  allUsers,
}) => {
  const { user } = useAuth();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  
  const author = comment.author as User;
  const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || author.email;
  const attachmentsData = comment.attachments_jsonb;
  const attachments: any[] = Array.isArray(attachmentsData) ? attachmentsData : attachmentsData ? [attachmentsData] : [];

  const mentionData = useMemo(() => [
    { 
        id: 'all', 
        display: 'all', 
        name: 'Everyone', 
        email: 'Notify everyone in this context', 
        initials: '@',
        avatar_url: undefined 
    },
    ...(allUsers || []).map(member => ({
        id: member.id,
        display: member.name,
        ...member
    }))
  ], [allUsers]);

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
              <div className="border rounded-md focus-within:ring-1 focus-within:ring-ring">
                <MentionsInput
                  value={editedText}
                  onChange={(e, newValue) => setEditedText(newValue)}
                  placeholder="Edit your comment..."
                  className="mentions-input w-full min-h-[80px]"
                  a11ySuggestionsListLabel={"Suggested mentions"}
                  autoFocus
                >
                  <Mention
                    trigger="@"
                    data={mentionData}
                    markup="@[__display__](__id__)"
                    displayTransform={(id, display) => `@${display}`}
                    renderSuggestion={(suggestion: any, search, highlightedDisplay, index, focused) => (
                      <div className={cn("mention-suggestion", focused && "focused")}>
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                          <AvatarFallback style={generatePastelColor(suggestion.id)}>
                            {suggestion.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="mention-suggestion-info">
                          <div className="font-medium text-sm">{highlightedDisplay}</div>
                          {suggestion.email && <div className="text-xs text-muted-foreground">{suggestion.email}</div>}
                        </div>
                      </div>
                    )}
                    style={{ 
                      backgroundColor: 'hsl(var(--primary) / 0.3)', 
                      color: 'transparent', 
                      fontWeight: 500,
                      padding: '0 1px',
                      borderRadius: '2px'
                    }}
                  />
                </MentionsInput>
              </div>
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
                <button
                  onClick={() => onGoToReply && comment.reply_to_comment_id && onGoToReply(comment.reply_to_comment_id)}
                  className="w-full text-left flex items-start gap-2 text-xs p-2 mb-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                  disabled={!onGoToReply || !comment.reply_to_comment_id}
                >
                  <div className="w-0.5 bg-primary rounded-full self-stretch"></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-primary">Replying to {comment.repliedMessage.senderName}</p>
                    <div className="italic line-clamp-3 prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&_p]:m-0 [&_p]:inline">
                      <MarkdownRenderer>{comment.repliedMessage.content || ''}</MarkdownRenderer>
                    </div>
                  </div>
                </button>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-0 [&_p]:text-justify">
                <MarkdownRenderer>{comment.text || ''}</MarkdownRenderer>
              </div>
              {attachments.length > 0 && (
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAttachmentModalOpen(true)}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
                  </Button>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-1 text-xs" onClick={() => onReply(comment)}>
                  <CornerUpLeft className="h-3 w-3 mr-1" /> Reply
                </Button>
                <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)} />
                {!comment.is_ticket && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-1 text-xs" onClick={() => onCreateTicketFromComment(comment)}>
                    <Ticket className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">Create Ticket</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {attachments.length > 0 && (
        <AttachmentViewerModal
          open={isAttachmentModalOpen}
          onOpenChange={setIsAttachmentModalOpen}
          attachments={attachments}
          commentId={comment.id}
        />
      )}
    </>
  );
};

export default Comment;