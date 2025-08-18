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
    return uniqueUsers.map(u => ({ id: u.id, display: u.name }));
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
            className="mentions-textarea"
            classNames={{
              control: "w-full",
              input: "w-full p-2 border rounded-md min-h-[100px] bg-background text-sm",
              suggestions: {
                list: "bg-background border rounded-md shadow-lg",
                item: "p-2 hover:bg-muted",
                "&focused": "bg-muted",
              },
            }}
          >
            <Mention
              trigger="@"
              data={mentionableUsers}
              className="bg-blue-100"
            />
          </MentionsInput>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button type="button" variant={isTicket ? "default" : "outline"} size="sm" onClick={() => setIsTicket(!isTicket)}>
              <Ticket className="mr-2 h-4 w-4" />
              {isTicket ? "This is a Ticket" : "Make a Ticket"}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="mr-2 h-4 w-4" />
                Attach File
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </Button>
          </div>
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
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
        <div className="flex items-center gap-4 mb-4">
          <Button variant={!showTickets ? "secondary" : "ghost"} onClick={() => setShowTickets(false)}>
            <MessageSquare className="mr-2 h-4 w-4" /> All Comments ({sortedItems.length})
          </Button>
          <Button variant={showTickets ? "secondary" : "ghost"} onClick={() => setShowTickets(true)}>
            <Ticket className="mr-2 h-4 w-4" /> Tickets ({sortedItems.filter(i => i.isTicket).length})
          </Button>
        </div>

        <div className="space-y-6">
          {filteredItems.map(item => {
            const isTicketCompleted = item.isTicket && project.tasks?.find(t => t.originTicketId === item.id)?.completed;
            return (
              <div key={item.id} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={item.author.avatar} />
                  <AvatarFallback>{item.author.initials || item.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
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