import { useState, useRef, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, Send, Ticket, X } from "lucide-react";
import { generatePastelColor, getAvatarUrl, getInitials } from "@/lib/utils";
import MentionInput from './MentionInput';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isTicketMode, setIsTicketMode] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  const mentionableUsers = useMemo(() => {
    if (!project) return [];
    const users = [project.created_by, ...project.assignedTo];
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
    return uniqueUsers.map(u => {
      return {
        id: u.id,
        display: u.name,
        avatar_url: u.avatar_url,
        initials: u.initials,
        email: u.email,
      };
    });
  }, [project]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await onAddCommentOrTicket(comment, isTicketMode, attachment);
      setComment("");
      setIsTicketMode(false);
      setAttachment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Comments & Tickets</h3>
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="border rounded-lg">
            <div className="p-4">
              <MentionInput
                ref={textareaRef}
                value={comment}
                onChange={setComment}
                placeholder={isTicketMode ? "Describe the ticket..." : "Add a comment... @ to mention"}
                userSuggestions={mentionableUsers}
                disabled={isSubmitting}
                className="min-h-[100px] border-none focus-visible:ring-0 p-0"
              />
            </div>
            <div className="flex justify-between items-center p-2 border-t bg-muted/50 rounded-b-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ticket-mode"
                  checked={isTicketMode}
                  onCheckedChange={(checked) => setIsTicketMode(!!checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="ticket-mode" className="text-sm font-medium">
                  Create a ticket
                </Label>
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting || !comment.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isTicketMode ? 'Create Ticket' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {(project.comments || []).map((c) => (
          <div key={c.id} className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={getAvatarUrl(c.author.avatar_url, c.author.id)} />
              <AvatarFallback>{c.author.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none mt-1">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => {
                      const href = props.href || '';
                      if (href.startsWith('/')) {
                        return <Link to={href} {...props} className="text-primary hover:underline" />;
                      }
                      return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />;
                    }
                  }}
                >
                  {c.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectComments;