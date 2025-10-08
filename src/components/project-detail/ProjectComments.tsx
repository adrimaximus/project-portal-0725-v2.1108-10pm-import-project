import { useState } from "react";
import { Project, Comment as CommentType, Task, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials, generatePastelColor } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProjectCommentsProps {
  project: Project;
  onCommentAdd: (text: string, isTicket: boolean) => Promise<CommentType | null>;
  onTaskAdd: (title: string, originTicketId: string) => void;
}

const ProjectComments = ({ project, onCommentAdd, onTaskAdd }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;

    const createdComment = await onCommentAdd(newComment.trim(), isCreatingTicket);

    if (isCreatingTicket && createdComment) {
      onTaskAdd(newComment.trim(), createdComment.id);
    }

    setNewComment("");
    setIsCreatingTicket(false);
  };

  const comments = project.comments || [];
  const tasks = project.tasks || [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment or create a ticket..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-ticket"
              checked={isCreatingTicket}
              onCheckedChange={(checked) => setIsCreatingTicket(!!checked)}
            />
            <label
              htmlFor="create-ticket"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Create a ticket
            </label>
          </div>
          <Button onClick={handleAddComment} disabled={!newComment.trim()}>
            {isCreatingTicket ? (
              <>
                <Ticket className="mr-2 h-4 w-4" />
                Create Ticket
              </>
            ) : (
              "Add Comment"
            )}
          </Button>
        </div>
      </div>

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
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.text}</p>
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