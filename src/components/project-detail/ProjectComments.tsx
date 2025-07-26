import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from 'lucide-react';

export type Comment = {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
};

interface ProjectCommentsProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

const ProjectComments = ({ comments, onAddComment }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState('');

  const handleAddClick = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets & Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={comment.avatar} alt={comment.author} />
                <AvatarFallback>{comment.author.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{comment.author}</p>
                  <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t">
          <div className="relative">
            <Textarea
              placeholder="Add a new comment or ticket..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="pr-16 min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddClick();
                }
              }}
            />
            <Button 
              size="icon" 
              className="absolute top-3 right-3 h-8 w-8"
              onClick={handleAddClick}
              disabled={!newComment.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;