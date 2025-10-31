import { useState, useRef } from 'react';
import { Project, Comment as CommentType, Task, User, ProjectFile } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Ticket, MoreHorizontal, Edit, Trash2, FileText, Paperclip, X, Loader2, SmilePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials, generatePastelColor, parseMentions, formatMentionsForDisplay, cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import CommentInput from "./CommentInput";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CommentAttachmentItem from './CommentAttachmentItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CommentReactionPicker from './CommentReactionPicker';
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
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => void;
  onUpdateComment: (project: Project, commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  isUpdatingComment?: boolean;
  updatedCommentId?: string;
}

const ProjectComments = ({ project, onAddCommentOrTicket, onUpdateComment, onDeleteComment, onToggleCommentReaction, isUpdatingComment, updatedCommentId }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isConvertingToTicket, setIsConvertingToTicket] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { data: allUsers = [] } = useProfiles();

  const handleEditClick = (comment: CommentType) => {
    const textWithoutAttachments = comment.text?.replace(/\n\n\*\*Attachments:\*\*[\s\S]*$/, '').trim() || '';
    setEditingCommentId(comment.id);
    setEditedText(textWithoutAttachments);
    setNewAttachments([]);
    setIsConvertingToTicket(comment.isTicket);
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
    <>
      <div className="space-y-6">
        <CommentInput project={project} onAddCommentOrTicket={onAddCommentOrTicket} allUsers={allUsers} />
        <div className="space-y-4 h-[300px] overflow-y-auto pr-4">
          {comments.map((comment) => {
            const author = comment.author;
            const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;
            const isTicket = comment.isTicket;
            const ticketTask = isTicket ? tasks.find((t) => t.originTicketId === comment.id) : null;
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
                  <AvatarImage src={author.avatar_url} />
                  <AvatarFallback style={generatePastelColor(author.id)}>
                    {getInitials(fullName, author.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{fullName}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: id })}
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
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => editFileInputRef.current?.click()}>
                                  <Paperclip className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Attach files</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <input type="file" ref={editFileInputRef} multiple onChange={handleEditFileChange} className="hidden" />
                          {!isTicket && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setIsConvertingToTicket(!isConvertingToTicket)} className={isConvertingToTicket ? 'bg-primary/10 text-primary' : ''}>
                                    <Ticket className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{isConvertingToTicket ? 'Convert back to comment' : 'Convert to ticket'}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {mainText && (
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
                      )}
                      <div className="mt-2 flex items-center gap-4 flex-wrap">
                        {isTicket && (
                          <div>
                            {ticketTask ? (
                              <Link to={`/projects/${project.slug}?tab=tasks&task=${ticketTask.id}`}>
                                <Badge variant={ticketTask.completed ? 'default' : 'destructive'} className={ticketTask.completed ? 'bg-green-600 hover:bg-green-700' : ''}>
                                  <Ticket className="h-3 w-3 mr-1" />
                                  {ticketTask.completed ? 'Done' : 'Ticket'}
                                </Badge>
                              </Link>
                            ) : isThisCommentBeingUpdated ? (
                              <Badge variant="outline">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Creating task...
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <Ticket className="h-3 w-3 mr-1" />
                                Ticket
                              </Badge>
                            )}
                          </div>
                        )}
                        {attachments.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs text-muted-foreground h-auto p-1">
                                <Paperclip className="h-3 w-3" />
                                <span>{attachments.length}</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Attachments ({attachments.length})</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {attachments.map((file, index) => (
                                  <CommentAttachmentItem key={file.url || file.file_url || index} file={file} />
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {(comment.reactions && comment.reactions.length > 0) && (
                          <div className="flex flex-wrap items-center gap-1">
                            {Object.entries(groupedReactions).map(([emoji, { users, userIds }]) => {
                                const hasReacted = user ? userIds.includes(user.id) : false;
                                return (
                                    <TooltipProvider key={emoji}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => onToggleCommentReaction(comment.id, emoji)}
                                                    className={cn(
                                                        "px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors border",
                                                        hasReacted
                                                        ? "bg-primary/20 border-primary/50"
                                                        : "bg-muted hover:bg-muted/80"
                                                    )}
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="font-medium text-xs">{users.length}</span>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{users.join(', ')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                          </div>
                        )}
                        <CommentReactionPicker onSelect={(emoji) => onToggleCommentReaction(comment.id, emoji)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
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

export default ProjectComments;