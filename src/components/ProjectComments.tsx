import { useState } from 'react';
import { Project, Comment, User } from '@/data/projects';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Paperclip, Send, AtSign } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from './ui/command';

interface ProjectCommentsProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const ProjectComments = ({ project, onUpdate }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);

  const allComments = [...(project.comments || []), ...(project.tickets || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleUserTag = (user: User) => {
    if (!taggedUsers.some(u => u.id === user.id)) {
      setTaggedUsers(prev => [...prev, user]);
      setNewComment(prev => `${prev}@${user.name} `);
    }
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      text: newComment,
      author: { id: 'current-user', name: 'You', initials: 'Y' },
      createdAt: new Date().toISOString(),
    };

    const updatedProject = {
      ...project,
      comments: [...(project.comments || []), comment],
    };

    onUpdate(updatedProject);
    setNewComment('');
    setTaggedUsers([]);
  };

  return (
    <div>
      <div className="space-y-4">
        {allComments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>{comment.author.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-start space-x-3">
        <Avatar>
          <AvatarImage />
          <AvatarFallback>Y</AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="pr-24"
          />
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon"><AtSign className="h-4 w-4" /></Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-56">
                <Command>
                  <CommandInput placeholder="Tag user..." />
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {project.assignedTo.map(user => (
                      <CommandItem key={user.id} onSelect={() => handleUserTag(user)}>
                        {user.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button size="icon" onClick={handleSubmit}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;