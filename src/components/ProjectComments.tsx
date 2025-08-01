import { useState } from "react";
import { Project, User, Comment } from "@/data/projects";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

interface ProjectCommentsProps {
  project: Project;
  assignableUsers: User[];
  allProjects: Project[];
  onAddCommentOrTicket: (comment: Comment) => void;
}

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const { user: currentUser } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isTicket, setIsTicket] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const newCommentObject: Comment = {
      id: `comment-${Date.now()}`,
      user: currentUser,
      date: new Date().toISOString(),
      text: newComment,
      isTicket: isTicket,
      ticketStatus: isTicket ? 'open' : undefined,
    };

    onAddCommentOrTicket(newCommentObject);
    setNewComment("");
    setIsTicket(false);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Comments & Tickets</h3>
      <div className="space-y-6">
        {project.comments?.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback>{comment.user.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{comment.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.date), { addSuffix: true })}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg mt-1">
                <p className="text-sm">{comment.text}</p>
              </div>
              {comment.isTicket && (
                <Badge variant="outline" className="mt-2">
                  Ticket: {comment.ticketStatus}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment or create a ticket..."
            className="pr-24"
          />
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
            <Button onClick={handleAddComment} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant={isTicket ? "secondary" : "ghost"} size="sm" onClick={() => setIsTicket(!isTicket)}>
                    <Tag className="h-4 w-4 mr-2"/>
                    {isTicket ? "Ticket" : "Create Ticket"}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;