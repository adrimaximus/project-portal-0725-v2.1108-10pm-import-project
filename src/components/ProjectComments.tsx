import { useState, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, CheckCircle2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Mention, MentionsInput } from "react-mentions";
import { Badge } from "./ui/badge";
import CommentRenderer from "./CommentRenderer";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mentionableUsers = useMemo(() => {
    if (!project) return [];
    const users = [project.created_by, ...project.assignedTo];
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
    return uniqueUsers.map(u => ({
      id: u.id,
      display: u.name,
      avatar_url: u.avatar_url,
      initials: u.initials,
      email: u.email,
    }));
  }, [project]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const isTicket = newComment.trim().startsWith("/ticket");
      const commentText = isTicket
        ? newComment.trim().substring(7).trim()
        : newComment;

      await onAddCommentOrTicket(commentText, isTicket, attachment);
      setNewComment("");
      setAttachment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedItems = useMemo(() => 
    [...(project.comments || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [project.comments]
  );

  const allProjectMembers = useMemo(() => [project.created_by, ...project.assignedTo], [project.created_by, project.assignedTo]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-card-foreground">Comments & Tickets</h3>
      
      <div className="space-y-6">
        {sortedItems.length > 0 ? sortedItems.map(item => {
          const isTicketCompleted = item.isTicket && project.tasks?.find(t => t.origin_ticket_id === item.id)?.completed;
          return (
            <div key={item.id} className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={getAvatarUrl(item.author.avatar_url, item.author.id)} />
                <AvatarFallback style={generatePastelColor(item.author.id)}>{item.author.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    {item.author.id === user?.id ? "You" : item.author.name}
                    {item.isTicket && (
                      <Badge variant={isTicketCompleted ? "default" : "destructive"} className={isTicketCompleted ? "bg-green-500 hover:bg-green-600" : ""}>
                        <Ticket className="mr-1.5 h-3 w-3" />
                        Ticket
                        {isTicketCompleted && <CheckCircle2 className="ml-1.5 h-3 w-3" />}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: id })}
                  </p>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <CommentRenderer text={item.text || ''} members={allProjectMembers} />
                </div>
                {item.attachment_url && (
                  <div className="mt-2">
                    <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-md max-w-max">
                      <Paperclip className="h-4 w-4" />
                      {item.attachment_name || 'View Attachment'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        }) : (
          <p className="text-sm text-muted-foreground text-center py-4">No comments or tickets yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border rounded-lg p-2 space-y-2">
        <MentionsInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... Type '/ticket' to create a ticket."
          a11ySuggestionsListLabel={"Suggested mentions"}
          classNames={{
            input: 'w-full text-sm bg-transparent placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none p-2',
            suggestions: {
              list: 'bg-popover text-popover-foreground border rounded-lg shadow-lg p-1 mt-2 z-10 max-h-60 overflow-y-auto',
              item: 'flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none',
              itemFocused: 'bg-accent text-accent-foreground',
            },
            mention: 'bg-primary/10 text-primary font-semibold rounded-sm',
          }}
        >
          <Mention
            trigger="@"
            data={mentionableUsers}
            renderSuggestion={(suggestion: any) => (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                  <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{suggestion.display}</span>
              </>
            )}
            appendSpaceOnAdd
          />
        </MentionsInput>
        
        {attachment && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-2 border-t">
            <Paperclip className="h-4 w-4" />
            <span>{attachment.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex justify-end items-center gap-2 pt-2 border-t">
          <Button type="button" variant="ghost" size="icon" asChild>
            <label htmlFor="file-upload" className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Paperclip className="h-5 w-5" />
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </Button>
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectComments;