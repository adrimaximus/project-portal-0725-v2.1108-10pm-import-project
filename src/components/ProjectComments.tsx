import { useState, useMemo } from "react";
import { Project, Comment } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useProjectMutations } from "@/hooks/useProjectMutations";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { CheckCircle2, MessageSquare, Plus } from "lucide-react";
import CommentRenderer from "./CommentRenderer";
import { useQueryClient } from "@tanstack/react-query";

const ProjectComments = ({ project }: { project: Project }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createComment } = useProjectMutations(project.id);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await createComment.mutateAsync({
        project_id: project.id,
        author_id: user.id,
        text: newComment,
      });
      setNewComment("");
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedItems = useMemo(() => 
    [...(project.comments || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [project.comments]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {user && (
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or create a ticket by typing '/ticket'..."
                  className="mb-2"
                />
                <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
                  {isSubmitting ? "Submitting..." : "Add Comment"}
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {sortedItems.length > 0 ? sortedItems.map(item => {
              const isTicketCompleted = item.is_ticket && project.tasks?.find(t => t.origin_ticket_id === item.id)?.completed;
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.author.avatar_url || undefined} />
                    <AvatarFallback>{item.author.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.author.id === user?.id ? "You" : item.author.name}</span>
                      {item.is_ticket && (
                        <Badge variant={isTicketCompleted ? "default" : "destructive"} className={isTicketCompleted ? "bg-green-500 hover:bg-green-600" : ""}>
                          {isTicketCompleted ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                          Ticket
                        </Badge>
                      )}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <CommentRenderer content={item.text} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;