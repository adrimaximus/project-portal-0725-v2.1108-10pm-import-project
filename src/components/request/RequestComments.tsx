import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { allUsers } from "@/data/users";
import { Comment } from "@/data/projects";
import { formatDistanceToNow } from "date-fns";
import { Lock, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RequestCommentsProps {
  comments: Comment[];
  onAddComment: (newComment: { content: string; isInternal: boolean }) => void;
}

const RequestComments = ({ comments, onAddComment }: RequestCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const currentUser = allUsers[0]; // Placeholder for the currently logged-in user

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment({
        content: newComment,
        isInternal: isInternal,
      });
      setNewComment("");
      setIsInternal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets & Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* New Comment Input */}
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment or raise a ticket..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="internal-note" checked={isInternal} onCheckedChange={setIsInternal} />
                  <Label htmlFor="internal-note" className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Internal Note
                  </Label>
                </div>
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments
                .slice() // Create a shallow copy to avoid mutating the original array
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by most recent
                .map((comment) => (
                  <div key={comment.id} className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                      <AvatarFallback>{comment.author.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{comment.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      {comment.isInternal && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600 mb-1">
                          <Lock className="h-3 w-3" />
                          <span>Internal Note</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No comments or tickets yet.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestComments;