import { useState, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, X } from "lucide-react";
import { Mention } from 'primereact/mention';
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isTicketMode, setIsTicketMode] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

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
      await onAddCommentOrTicket(newComment, isTicketMode, attachment);
      setNewComment("");
      setIsTicketMode(false);
      setAttachment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSearch = (event: { query: string, trigger: string }) => {
    if (event.trigger === '@') {
      setTimeout(() => {
        const query = event.query;
        let suggestions;
        if (!query.trim().length) {
          suggestions = [...mentionableUsers];
        } else {
          suggestions = mentionableUsers.filter((user) =>
            user.display.toLowerCase().startsWith(query.toLowerCase())
          );
        }
        setSuggestions(suggestions);
      }, 250);
    }
  };

  const itemTemplate = (suggestion: any) => {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
          <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm">{suggestion.display}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative w-full text-sm rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Mention
          value={newComment}
          onChange={(e: any) => setNewComment(e.target.value)}
          trigger="@"
          suggestions={suggestions}
          onSearch={onSearch}
          field="display"
          placeholder={isTicketMode ? "Describe the task or issue..." : "Add a comment... @ to mention"}
          itemTemplate={itemTemplate}
          rows={5}
          className="w-full"
          inputClassName="w-full min-h-[100px] p-3 text-sm bg-transparent placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button type="button" variant={isTicketMode ? "default" : "outline"} size="sm" onClick={() => setIsTicketMode(!isTicketMode)} className="flex-1">
            <Ticket className="mr-2 h-4 w-4" />
            {isTicketMode ? "This is a Ticket" : "Make a Ticket"}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild className="flex-1">
            <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
              <Paperclip className="mr-2 h-4 w-4" />
              Attach File
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </Button>
        </div>
        <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="w-full sm:w-auto" size="sm">
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
      {attachment && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          <span>{attachment.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachment(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </form>
  );
};

export default ProjectComments;