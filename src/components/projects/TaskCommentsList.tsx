import React from 'react';
import { Comment as CommentType, User } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials, formatMentionsForDisplay } from '@/lib/utils';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Ticket, CornerUpLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import CommentReactions from '../CommentReactions';

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
  onReply: (author: User) => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
}

const Comment: React.FC<{
  comment: CommentType;
  onEdit: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  isEditing: boolean;
  editedText: string;
  setEditedText: (text: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  newAttachments: File[];
  removeNewAttachment: (index: number) => void;
  handleEditFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editFileInputRef: React.RefObject<HTMLInputElement>;
  onReply: (author: User) => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
}> = ({
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
}) => {
  const { user } = useAuth();
  
  const author = comment.author as User;
  const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || author.email;
  const formattedText = formatMentionsForDisplay(comment.text || '');

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
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
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
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formattedText}</ReactMarkdown>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onReply(author)}>
                <CornerUpLeft className="h-3 w-3 mr-1" /> Reply
              </Button>
              <CommentReactions reactions={comment.reactions || []} onToggleReaction={(emoji) => onToggleReaction(comment.id, emoji)} />
              <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onCreateTicketFromComment(comment)}>
                <Ticket className="h-3 w-3 mr-1" /> Create Ticket
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TaskCommentsList: React.FC<TaskCommentsListProps> = (props) => {
  const { comments, isLoading, ...rest } = props;

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          isEditing={props.editingCommentId === comment.id}
          {...rest}
        />
      ))}
    </div>
  );
};

export default TaskCommentsList;