import { useState, useRef } from 'react';
import { Project, Comment as CommentType, Task, User, ProjectFile } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Ticket, MoreHorizontal, Edit, Trash2, FileText, Eye, Download, Paperclip, X, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials, generatePastelColor, parseMentions, formatMentionsForDisplay } from "@/lib/utils";
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
import FileIcon from './FileIcon';
import CommentAttachmentItem from './CommentAttachmentItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => void;
  onUpdateComment: (commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => void;
  onDeleteComment: (commentId: string) => void;
  isUpdatingComment?: boolean;
  updatedCommentId?: string;
}

const ProjectComments = ({ project, onAddCommentOrTicket, onUpdateComment, onDeleteComment, isUpdatingComment, updatedCommentId }: ProjectCommentsProps) => {
  const { user: currentUser } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isConvertingToTicket, setIsConvertingToTicket] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (comment: CommentType) => {
    // Saat mengedit, kita hanya mengambil teks utama, menghapus markdown lampiran lama
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
      onUpdateComment(editingCommentId, editedText, newAttachments, isConvertingToTicket, mentionedUserIds);
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

  const comments = project.comments || [];
  const tasks = project.tasks || [];

  return (
    <>
      <div className="space-y-6">
        <CommentInput project={project} onAddCommentOrTicket={onAddCommentOrTicket} />
        <div className="space-y-4 h-[300px] overflow-y-auto pr-4">
          {comments.map((comment) => {
            const author = comment.author;
            const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;
            const isTicket = comment.isTicket;
            const ticketTask = isTicket ? tasks.find((t) => t.originTicketId === comment.id) : null;
            const canManageComment = currentUser && (comment.author.id === currentUser.id || currentUser.role === 'admin' || currentUser.role === 'master admin');
            
            // Mengambil teks utama tanpa markdown lampiran
            const textWithoutAttachments = comment.text?.replace(/\n\n\*\*Attachments:\*\*[\s\S]*$/, '').trim() || '';
            const mainText = textWithoutAttachments;
            
            const attachmentsData = comment.attachments_jsonb;
            const attachments: ProjectFile[] = Array.isArray(attachmentsData)
              ? attachmentsData
              : attachmentsData
              ? [attachmentsData]
              : [];

            const isThisCommentBeingUpdated = isUpdatingComment && updatedCommentId === comment.id;

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
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
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
                                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span>{file.name}</span>
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
                      {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {attachments.map((file) => (
                            <CommentAttachmentItem key={file.id} file={file} />
                          ))}
                        </div>
                      )}
                      {(isTicket || attachments.length > 0) && (
                        <div className="mt-2 flex items-center gap-4">
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
                                  {attachments.map((file) => (
                                    <CommentAttachmentItem key={file.id} file={file} />
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      )}
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