import { useState } from "react";
import { Project, Comment, dummyProjects } from "@/data/projects";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Paperclip, Send, Ticket } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { MentionsInput, Mention } from 'react-mentions';
import './mentions-style.css';

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (comment: Comment) => void;
}

const ProjectComments = ({
  project,
  onAddCommentOrTicket,
}: ProjectCommentsProps) => {
  const { user: currentUser } = useUser();
  const [newCommentText, setNewCommentText] = useState("");
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const usersForMentions = project.assignedTo.map(user => ({
    id: user.id,
    display: user.name,
  }));

  const projectsForMentions = dummyProjects.map(p => ({
    id: p.id,
    display: p.name,
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    const fileInput = document.getElementById('comment-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = () => {
    if (newCommentText.trim() === "" && !attachment) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: currentUser,
      text: newCommentText,
      timestamp: new Date().toISOString(),
      isTicket: isTicket,
      attachment: attachment ? { name: attachment.name, url: URL.createObjectURL(attachment) } : undefined,
    };

    onAddCommentOrTicket(newComment);
    setNewCommentText("");
    setIsTicket(false);
    setAttachment(null);
    const fileInput = document.getElementById('comment-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const sortedComments = [...(project.comments || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Comments & Tickets</h3>
        <div className="rounded-lg border bg-background">
          <MentionsInput
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment or create a ticket... Type '@' to mention a user, '/' to link a project."
            className="mentions"
            a11ySuggestionsListLabel="Suggested mentions"
          >
            <Mention
              trigger="@"
              data={usersForMentions}
              markup="@[__display__](__id__)"
              className="mentions__mention"
            />
            <Mention
              trigger="/"
              data={projectsForMentions}
              markup="/[__display__](__id__)"
              className="mentions__mention"
            />
          </MentionsInput>
          <div className="flex items-center justify-between p-2 border-t bg-muted/50">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Label htmlFor="comment-attachment" className="cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                  <input id="comment-attachment" type="file" className="sr-only" onChange={handleFileChange} />
                </Label>
              </Button>
              <Button variant={isTicket ? "secondary" : "ghost"} size="icon" onClick={() => setIsTicket(!isTicket)}>
                <Ticket className="h-4 w-4" />
              </Button>
              {attachment && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 pl-2">
                  <span>{attachment.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveAttachment}>
                    &times;
                  </Button>
                </div>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!newCommentText.trim() && !attachment}>
              Send
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sortedComments.map(comment => (
          <div key={comment.id} className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-card-foreground">
                  {comment.author.name}
                  {comment.isTicket && <span className="ml-2 text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Ticket</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: id })}
                </p>
              </div>
              <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{
                __html: comment.text
                  .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="bg-primary/20 text-primary font-semibold rounded-sm px-1">@$1</span>')
                  .replace(/\/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="/projects/$2" class="text-primary hover:underline">$1</a>')
              }} />
              {comment.attachment && (
                <div className="mt-2">
                  <a href={comment.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    {comment.attachment.name}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectComments;