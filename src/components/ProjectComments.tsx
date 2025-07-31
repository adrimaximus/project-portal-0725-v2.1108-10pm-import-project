import { useState, useRef, ChangeEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Ticket, X } from 'lucide-react';
import { allUsers, Project, User } from '@/data/projects';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Comment as CommentData } from '@/data/comments';
import { formatDistanceToNow } from 'date-fns';

const RenderCommentText = ({ text, allProjects }: { text: string, allProjects: Project[] }) => {
  const parts = text.split(/(@[a-zA-Z0-9\s._-]+|#\/[a-zA-Z0-9\s._-]+)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return <strong key={index} className="text-primary font-medium">{part}</strong>;
        }
        if (part.startsWith('#/')) {
          const projectName = part.substring(2).trim();
          const project = allProjects.find(p => p.name === projectName);
          if (project) {
            return <a key={index} href={`/projects/${project.id}`} className="text-primary font-medium hover:underline">{part}</a>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface ProjectCommentsProps {
  project: Project;
  onAddComment: (comment: CommentData) => void;
  allProjects: Project[];
}

const ProjectComments = ({ project, onAddComment, allProjects }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = () => {
    if (newComment.trim() === '' && !attachment) return;

    const commentToAdd: CommentData = {
      id: `comment-${Date.now()}`,
      projectId: project.id,
      user: { name: 'Current User', avatar: 'https://i.pravatar.cc/150?u=currentUser' },
      text: newComment,
      timestamp: new Date().toISOString(),
      isTicket,
      attachment: attachment ? {
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
        url: URL.createObjectURL(attachment),
      } : undefined,
    };

    onAddComment(commentToAdd);
    setNewComment('');
    setIsTicket(false);
    setAttachment(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachment(event.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Comments & Tickets</h3>
        <div className="space-y-4">
          {project.comments?.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3">
              <Avatar>
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{comment.user.name}</p>
                    {comment.isTicket && <Badge variant="destructive">Ticket</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  <RenderCommentText text={comment.text} allProjects={allProjects} />
                </p>
                {comment.attachment && (
                  <div className="mt-2">
                    <a href={comment.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      {comment.attachment.name} ({(comment.attachment.size / 1024).toFixed(2)} KB)
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment or create a ticket..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        {attachment && (
          <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              <span>{attachment.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant={isTicket ? "destructive" : "outline"} size="sm" onClick={() => setIsTicket(!isTicket)}>
              <Ticket className="h-4 w-4 mr-2" />
              {isTicket ? 'Creating Ticket' : 'Create Ticket'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
          <Button onClick={handleAddComment} disabled={!newComment.trim() && !attachment}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;