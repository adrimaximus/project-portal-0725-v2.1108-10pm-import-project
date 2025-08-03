import { useState, useRef, useMemo } from "react";
import { Project, Comment, AssignedUser, dummyUsers } from "@/data/projects";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, File as FileIcon, Image as ImageIcon, Ticket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (comment: Comment) => void;
}

const CommentItem = ({ comment }: { comment: Comment }) => {
  const renderText = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(mentionRegex);

    return (
      <>
        {parts.map((part, index) => {
          if (index % 3 === 1) {
            const userName = part;
            return (
              <span key={index} className="font-semibold text-blue-600">
                @{userName}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="flex space-x-3">
      <Avatar>
        <AvatarImage src={comment.author.avatar} />
        <AvatarFallback>{comment.author.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{comment.author.name}</p>
            {comment.isTicket && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Ticket size={12} /> Tiket
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: id })}
          </p>
        </div>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {renderText(comment.text)}
        </div>
        {comment.attachment && (
          <div className="mt-2 p-2 border rounded-md flex items-center space-x-2 text-sm">
            {comment.attachment.type.startsWith("image/") ? (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <a href={comment.attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {comment.attachment.name}
            </a>
            <span className="text-xs text-muted-foreground">({(comment.attachment.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const { user: currentUser } = useUser();
  const [commentText, setCommentText] = useState("");
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isMentioning, setIsMentioning] = useState(false);

  const availableUsers = useMemo(() => {
    return dummyUsers.filter(u => u.id !== currentUser.id);
  }, [currentUser.id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim() && !attachment) return;

    let attachmentData: Comment['attachment'] | undefined = undefined;
    if (attachment) {
      attachmentData = {
        name: attachment.file.name,
        url: attachment.preview,
        type: attachment.file.type,
        size: attachment.file.size,
      };
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, initials: currentUser.initials },
      text: commentText,
      timestamp: new Date().toISOString(),
      isTicket,
      attachment: attachmentData,
    };

    onAddCommentOrTicket(newComment);
    setCommentText("");
    setAttachment(null);
    setIsTicket(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCommentText(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setIsMentioning(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setIsMentioning(false);
    }
  };

  const handleMentionSelect = (user: AssignedUser) => {
    if (textareaRef.current) {
      const text = commentText;
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      const textAfterCursor = text.substring(cursorPos);

      const newText = textBeforeCursor.replace(/@(\w*)$/, `@\[${user.name}\](${user.id}) `) + textAfterCursor;
      setCommentText(newText);
      setIsMentioning(false);
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {project.comments?.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
      <div className="flex space-x-3">
        <Avatar>
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Popover open={isMentioning} onOpenChange={setIsMentioning}>
            <PopoverTrigger asChild>
              <Textarea
                ref={textareaRef}
                value={commentText}
                onChange={handleTextChange}
                placeholder="Tulis komentar atau buat tiket..."
                className="mb-2"
              />
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Sebut nama..." value={mentionQuery} onValueChange={setMentionQuery} />
                <CommandList>
                  <CommandEmpty>Tidak ada pengguna ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {availableUsers
                      .filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                      .map(user => (
                        <CommandItem key={user.id} onSelect={() => handleMentionSelect(user)}>
                          {user.name}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {attachment && (
            <div className="mb-2 p-2 border rounded-md flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {attachment.file.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{attachment.file.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <div className="flex items-center space-x-2">
                <Switch id="ticket-mode" checked={isTicket} onCheckedChange={setIsTicket} />
                <Label htmlFor="ticket-mode" className="text-sm">Jadikan Tiket</Label>
              </div>
            </div>
            <Button onClick={handleSendComment} disabled={!commentText.trim() && !attachment}>
              <Send className="h-4 w-4 mr-2" />
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;