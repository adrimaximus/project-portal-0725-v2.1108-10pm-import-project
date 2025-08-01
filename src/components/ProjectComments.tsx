import { useState } from 'react';
import { Comment, Task, AssignedUser, Project } from '@/data/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCommentsProps {
  projectId: string;
  comments: Comment[];
  tasks: Task[];
  currentUser: AssignedUser;
  teamMembers: AssignedUser[];
  allProjects: Project[];
  onAddCommentOrTicket: (comment: Comment) => void;
}

const ProjectComments = ({
  projectId,
  comments,
  tasks,
  currentUser,
  onAddCommentOrTicket,
}: ProjectCommentsProps) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [isTicket, setIsTicket] = useState(false);

  const handleAddComment = () => {
    if (newCommentText.trim() === '') return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      projectId,
      user: currentUser,
      text: newCommentText,
      timestamp: new Date().toISOString(),
      isTicket,
    };

    onAddCommentOrTicket(newComment);
    setNewCommentText('');
    setIsTicket(false);
  };

  const getTicketStatus = (commentId: string) => {
    const task = tasks.find(t => t.originTicketId === commentId);
    if (task) {
      return task.completed ? 'Done' : 'Ticket';
    }
    return 'Ticket';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <Textarea
          placeholder="Add a comment or create a ticket by mentioning a team member..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant={isTicket ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setIsTicket(!isTicket)}
              className={isTicket ? "text-primary" : "text-muted-foreground"}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {isTicket ? 'Creating Ticket' : 'Create Ticket'}
            </Button>
          </div>
          <Button onClick={handleAddComment}>
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {comments.slice().reverse().map(comment => (
          <div key={comment.id} className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback>{comment.user.initials || comment.user.name.slice(0,2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </span>
                </div>
                {comment.isTicket && (
                  <Badge
                    variant="default"
                    className={
                      getTicketStatus(comment.id) === 'Done'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }
                  >
                    {getTicketStatus(comment.id)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-1">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectComments;