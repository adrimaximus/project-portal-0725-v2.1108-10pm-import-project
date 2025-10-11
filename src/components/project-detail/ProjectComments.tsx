import { useState, useMemo } from "react";
import { Project, Comment as CommentType, Task, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket, MoreVertical, Trash2, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials, generatePastelColor } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import CommentInput from "../CommentInput";
import CommentRenderer from "../CommentRenderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ProjectCommentsProps {
  project: Project;
  onCommentAdd: (text: string, isTicket: boolean, attachment: File | null) => Promise<CommentType | null>;
  onTaskAdd: (title: string, originTicketId: string) => void;
}

const ProjectComments = ({ project, onCommentAdd, onTaskAdd }: ProjectCommentsProps) => {
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectMembers = useMemo(() => {
    if (!project) return [];
    const members = [...(project.assignedTo || [])];
    if (project.created_by && !members.some(m => m.id === project.created_by.id)) {
      members.push(project.created_by);
    }
    return members;
  }, [project]);

  const handleUpdateComment = async () => {
    // Implement update logic here if needed
  };

  const handleDeleteComment = async (commentId: string) => {
    // Implement delete logic here if needed
  };

  const comments = project.comments || [];
  const tasks = project.tasks || [];

  return (
    <div className="space-y-6">
      <CommentInput project={project} onAddCommentOrTicket={onCommentAdd} />

      <div className="space-y-4">
        {comments.map((comment) => {
          const author = comment.author;
          const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;
          const isTicket = comment.isTicket;
          const ticketTask = isTicket ? tasks.find((t) => t.originTicketId === comment.id) : null;

          return (
            <div key={comment.id} className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={author.avatar_url} />
                <AvatarFallback style={generatePastelColor(author.id)}>
                  {getInitials(fullName, author.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{fullName}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </span>
                </div>
                {editingComment?.id === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editingComment.text}
                      onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingComment(null)} disabled={isSubmitting}>Cancel</Button>
                      <Button onClick={handleUpdateComment} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {comment.text && <CommentRenderer text={comment.text} members={projectMembers} />}
                    {comment.attachment_url && comment.attachment_name && (
                      <div className="mt-2">
                        <a
                          href={comment.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 p-2 rounded-md transition-colors"
                        >
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{comment.attachment_name}</span>
                        </a>
                      </div>
                    )}
                  </>
                )}
                {isTicket && (
                  <div className="mt-2">
                    <Badge variant={ticketTask?.completed ? 'default' : 'destructive'} className={ticketTask?.completed ? 'bg-green-600 hover:bg-green-700' : ''}>
                      <Ticket className="h-3 w-3 mr-1" />
                      {ticketTask?.completed ? 'Done' : 'Ticket'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectComments;