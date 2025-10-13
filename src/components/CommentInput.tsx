import { useState, useRef } from "react";
import { Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Ticket, X } from "lucide-react";
import MentionInput from "./MentionInput";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import CommentAttachmentDialog from "./CommentAttachmentDialog";

interface CommentInputProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null) => void;
}

const CommentInput = ({ project, onAddCommentOrTicket }: CommentInputProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isTicket, setIsTicket] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);

  const mentionableUsers = (project.assignedTo || []).map(member => ({
    id: member.id,
    display: member.name,
    avatar_url: member.avatar_url || '',
    initials: member.initials || 'NN',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      await onAddCommentOrTicket(newComment, isTicket, attachments);
      setNewComment("");
      setIsTicket(false);
      setAttachments([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            placeholder={isTicket ? "Describe the task or issue..." : "Add a comment... @ to mention"}
            userSuggestions={mentionableUsers}
            projectSuggestions={[]}
            disabled={isSubmitting}
            className="min-h-[100px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="button" variant={isTicket ? "default" : "outline"} size="sm" onClick={() => setIsTicket(!isTicket)} className="flex-1">
              <Ticket className="mr-2 h-4 w-4" />
              {isTicket ? "This is a Ticket" : "Make a Ticket"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setIsAttachmentDialogOpen(true)}>
              <Paperclip className="mr-2 h-4 w-4" />
              Attach Files
              {attachments.length > 0 && <span className="ml-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">{attachments.length}</span>}
            </Button>
          </div>
          <Button type="submit" disabled={isSubmitting || (!newComment.trim() && attachments.length === 0)} className="w-full sm:w-auto" size="sm">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
      <CommentAttachmentDialog
        open={isAttachmentDialogOpen}
        onOpenChange={setIsAttachmentDialogOpen}
        files={attachments}
        onFilesChange={setAttachments}
      />
    </>
  );
};

export default CommentInput;