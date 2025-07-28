import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { allUsers } from "@/data/users";
import { Comment, Project } from "@/data/projects";
import { formatDistanceToNow } from "date-fns";
import { Ticket, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCommentsProps {
  comments: Comment[];
  onCommentPost: (newComment: Comment) => void;
  onTicketCreate?: (taskText: string) => void;
}

const ProjectComments = ({ comments, onCommentPost, onTicketCreate }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [isTicket, setIsTicket] = useState(false);
  const currentUser = allUsers[0]; // Assuming the current user is the first one

  const handlePostComment = () => {
    if (newComment.trim() === "") return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      user: currentUser,
      text: newComment,
      timestamp: new Date().toISOString(),
      isTicket: isTicket,
    };

    onCommentPost(comment);

    if (isTicket && onTicketCreate) {
      onTicketCreate(newComment);
    }

    setNewComment("");
    setIsTicket(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Comments & Tickets</h3>
        <p className="text-sm text-muted-foreground">
          Discuss the project or create tasks from comments.
        </p>
      </div>

      <div className="flex items-start space-x-4">
        <Avatar>
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Write a comment or create a new ticket..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            <Button
              variant={isTicket ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsTicket(!isTicket)}
              className={cn(
                "gap-2",
                isTicket && "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              <Ticket className="h-4 w-4" />
              <span>{isTicket ? "Ticket Created on Post" : "Create Ticket"}</span>
            </Button>
            <Button size="sm" onClick={handlePostComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Post
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <p className="font-semibold">{comment.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </p>
                  {comment.isTicket && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <Ticket className="mr-1.5 h-3 w-3" />
                      Ticket
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectComments;