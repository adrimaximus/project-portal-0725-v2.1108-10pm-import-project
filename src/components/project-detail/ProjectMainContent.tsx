import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Comment } from "@/data/comments";
import { Dispatch, SetStateAction, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

interface ProjectMainContentProps {
  project: Project;
  comments: Comment[];
  setComments: Dispatch<SetStateAction<Comment[]>>;
}

export default function ProjectMainContent({ project, comments, setComments }: ProjectMainContentProps) {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim() === "") return;

    const commentToAdd: Comment = {
      id: `COMMENT-${Date.now()}`,
      author: {
        name: "You", // Assuming the current user
        avatar: "https://i.pravatar.cc/150?u=currentUser",
      },
      timestamp: new Date().toISOString(),
      content: newComment,
    };

    setComments([commentToAdd, ...comments]);
    setNewComment("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {project.services?.length ? (
                project.services.map((service) => (
                  <Badge key={service} variant="secondary">{service}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No services listed.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/150?u=currentUser" />
                <AvatarFallback>YOU</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Add Comment
                </Button>
              </div>
            </div>
            <div className="space-y-6 pt-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                    <AvatarFallback>{comment.author.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{comment.author.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}