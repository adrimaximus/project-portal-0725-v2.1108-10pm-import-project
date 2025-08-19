import { useState, useMemo } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, X } from "lucide-react";
import MentionsInput, { MentionUser } from "@/components/MentionsInput";
import { MentionMeta, serializeMentions } from "@/lib/mention-utils";

interface CommentInputProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const CommentInput = ({ project, onAddCommentOrTicket }: CommentInputProps) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<MentionMeta[]>([]);
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mentionUsers: MentionUser[] = useMemo(() => {
    const all = [project.created_by, ...project.assignedTo];
    const unique = Array.from(new Map(all.map(u => [u.id, u])).values());
    return unique.map(u => {
      const fullName = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'User';
      return {
        id: u.id,
        display_name: fullName,
        email: u.email,
        handle: fullName,
      };
    });
  }, [project]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const serializedText = serializeMentions(text, mentions);
    if (!serializedText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await onAddCommentOrTicket(serializedText, isTicket, attachment);
      setText("");
      setMentions([]);
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
          value={text}
          onChange={setText}
          mentions={mentions}
          onMentionsChange={setMentions}
          users={mentionUsers}
          placeholder={isTicket ? "Describe the task or issue..." : "Add a comment... @ to mention"}
          rows={4}
          inputClassName="bg-[#fafbfc] dark:bg-[#0d1525] text-foreground placeholder:text-muted-foreground border-border"
        />
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
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </label>
          </Button>
        </div>
        <Button type="submit" disabled={isSubmitting || !text.trim()}>
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