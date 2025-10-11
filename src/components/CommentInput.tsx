import { useState, useMemo, useRef } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, X } from "lucide-react";
import { Mention, MentionsInput } from "react-mentions";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface CommentInputProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const CommentInput = ({ project, onAddCommentOrTicket }: CommentInputProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <MentionsInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isTicket ? "Describe the task or issue..." : "Add a comment... @ to mention"}
          a11ySuggestionsListLabel={"Suggested mentions"}
          classNames={{
            control: 'relative w-full',
            input: 'w-full min-h-[100px] p-3 text-sm rounded-lg border bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            suggestions: {
              list: 'bg-popover text-popover-foreground border rounded-lg shadow-lg p-1 mt-2 z-10 max-h-60 overflow-y-auto',
              item: 'flex items-center gap-3 px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none',
              itemFocused: 'bg-accent text-accent-foreground',
            },
            mention: 'bg-primary/10 text-primary font-semibold rounded-sm px-2 py-1',
          }}
          disabled={isSubmitting}
        >
          <Mention
            trigger="@"
            data={mentionableUsers}
            markup="@[__display__](__id__)"
            displayTransform={(id, display) => `@${display}`}
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
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button type="button" variant={isTicket ? "default" : "outline"} size="sm" onClick={() => setIsTicket(!isTicket)} className="flex-1">
            <Ticket className="mr-2 h-4 w-4" />
            {isTicket ? "This is a Ticket" : "Make a Ticket"}
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
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </form>
  );
};

export default CommentInput;