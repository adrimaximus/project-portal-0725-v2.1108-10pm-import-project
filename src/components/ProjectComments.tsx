import { useState, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, MessageSquare, CheckCircle2, X } from "lucide-react";
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
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  const mentionableUsers = useMemo(() => {
    if (!project) return [];
    const users = [project.created_by, ...project.assignedTo];
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
    return uniqueUsers.map(u => {
      let displayName = u.name;
      if (displayName.includes('@') && !displayName.includes(' ')) {
        displayName = displayName.split('@')[0];
      }
      return {
        id: u.id,
        display: displayName,
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
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await onAddCommentOrTicket(newComment, isTicket, attachment);
      setNewComment("");
      setIsTicket(false);
      setAttachment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedItems = useMemo(() => 
    [...(project.comments || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [project.comments]
  );

  const filteredItems = useMemo(() => {
    if (showTickets) {
      return sortedItems.filter(item => item.isTicket);
    }
    return sortedItems;
  }, [sortedItems, showTickets]);

  const allProjectMembers = useMemo(() => [project.created_by, ...project.assignedTo], [project.created_by, project.assignedTo]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <MentionsInput
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isTicket ? "Describe the task or issue..." : "Add a comment... @ to mention"}
            classNames={{
              control: 'relative w-full',
              input: 'w-full min-h-[100px] p-3 text-sm rounded-lg border bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              suggestions: {
                list: 'bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden p-1 max-h-60 overflow-y-auto mt-2 z-10',
                item: 'pl-3 pr-5 py-2 text-sm rounded-md cursor-pointer',
                itemFocused: 'bg-accent text-accent-foreground',
              },
              mention: 'bg-primary/10 text-primary font-semibold rounded-sm px-2 py-1',
            }}
          >
            <Mention
              trigger="@"
              data={mentionableUsers}
              renderSuggestion={(suggestion: any) => (
                <div className="font-medium text-sm text-foreground">{suggestion.display}</div>
              )}
              appendSpaceOnAdd
            />
          </MentionsInput>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button type="button" variant={isTicket ? "default" : "outline"} size="sm" onClick={() => setIsTicket(!isTicket)} className="w-9 sm:w-auto px-0 sm:px-3">
              <Ticket className="h-4 w-4 mx-auto sm:mr-2" />
              <span className="hidden sm:inline">{isTicket ? "This is a Ticket" : "Make a Ticket"}</span>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center w-9 sm:w-auto px-0 sm:px-3">
                <Paperclip className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Attach File</span>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </Button>
          </div>
          <div>
            <Button type="submit" size="icon" className="sm:hidden" disabled={isSubmitting || !newComment.trim()}>
                <Send className="h-4 w-4" />
            </Button>
            <Button type="submit" className="hidden sm:inline-flex" disabled={isSubmitting || !newComment.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
        {attachment && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span>{attachment.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </form>

      <div>
        <div className="flex items-center gap-4 mb-4 border-b">
          <Button variant="ghost" onClick={() => setShowTickets(false)} className={`rounded-none ${!showTickets ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> All Comments ({sortedItems.length})
          </Button>
          <Button variant="ghost" onClick={() => setShowTickets(true)} className={`rounded-none ${showTickets ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            <Ticket className="mr-2 h-4 w-4" /> Tickets ({sortedItems.filter(i => i.isTicket).length})
          </Button>
        </div>

        <div className="space-y-6">
          {filteredItems.map(item => {
            const isTicketCompleted = item.isTicket && project.tasks?.find(t => t.originTicketId === item.id)?.completed;
            return (
              <div key={item.id} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={getAvatarUrl(item.author.avatar_url, item.author.id)} />
                  <AvatarFallback style={generatePastelColor(item.author.id)}>{item.author.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      {item.author.name}
                      {item.isTicket && (
                        <Badge variant={isTicketCompleted ? "default" : "secondary"} className={isTicketCompleted ? "bg-green-500 hover:bg-green-600" : ""}>
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
                  <div className="mt-1">
                    <CommentRenderer text={item.text || ''} members={allProjectMembers} />
                  </div>
                  {item.attachment_url && (
                    <div className="mt-2">
                      <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-md">
                        <Paperclip className="h-4 w-4" />
                        {item.attachment_name || 'View Attachment'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;