import { useState, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, X } from "lucide-react";
import { Mention, MentionsInput } from "react-mentions";

interface CommentInputProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const mentionInputClassNames = {
  control: 'relative w-full',
  input:
    'w-full min-h-[100px] p-3 text-sm rounded-lg border bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  suggestions: {
    list:
      'bg-popover text-popover-foreground border rounded-xl shadow-md overflow-hidden max-h-60 overflow-y-auto mt-2 z-50 p-2',
    item:
      'px-3 py-2 text-sm rounded-md cursor-pointer transition-colors text-foreground hover:bg-accent/60',
    itemFocused: 'bg-accent text-accent-foreground',
  },
  mention: 'bg-primary/10 text-primary font-semibold rounded-sm px-2 py-1',
};

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
      let displayName = u.name;
      if (displayName.includes('@') && !displayName.includes(' ')) {
        displayName = displayName.split('@')[0];
      }
      return {
        id: u.id,
        display: displayName,
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
          classNames={mentionInputClassNames}
        >
          <Mention
            trigger="@"
            data={mentionableUsers}
            renderSuggestion={(suggestion: any) => (
              <div className="w-full">
                <span className="font-medium">{suggestion.display}</span>
              </div>
            )}
            appendSpaceOnAdd
          />
        </MentionsInput>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant={isTicket ? "default" : "outline"}
            size="sm"
            onClick={() => setIsTicket(!isTicket)}
          >
            <Ticket className="mr-2 h-4 w-4" />
            {isTicket ? "This is a Ticket" : "Make a Ticket"}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="mr-2 h-4 w-4" />
              Attach File
              <input id="file-upload" type="file" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
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
  );
};

export default CommentInput;