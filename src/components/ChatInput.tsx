import { useState, useRef, FormEvent, useEffect, ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";
import { currentUser, collaborators, Collaborator } from "@/data/collaborators";
import { Popover, PopoverContent } from "@/components/ui/popover";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State for mentions
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [filteredCollaborators, setFilteredCollaborators] = useState<Collaborator[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() || file) {
      onSendMessage(message, file ?? undefined);
      setMessage("");
      handleRemoveAttachment();
      setShowMention(false);
    }
  };

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    
    if (lastAt !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAt + 1);
      if (!/\s/.test(textAfterAt)) { // No spaces after @
        setMentionQuery(textAfterAt);
        setShowMention(true);
        return;
      }
    }
    setShowMention(false);
  };

  useEffect(() => {
    if (showMention) {
      setFilteredCollaborators(
        collaborators.filter(c =>
          c.name.toLowerCase().includes(mentionQuery.toLowerCase())
        )
      );
    } else {
      setFilteredCollaborators([]);
    }
  }, [mentionQuery, showMention]);

  const handleMentionSelect = (name: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = message.substring(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    
    const newMessage = `${message.substring(0, lastAt)}@${name} ${message.substring(cursorPos)}`;
    
    setMessage(newMessage);
    setShowMention(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = lastAt + name.length + 2; // after "@name "
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="p-4 border-t bg-background">
      <form onSubmit={handleSubmit} className="flex w-full items-start space-x-4">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={currentUser.src} alt="You" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
        <div className="w-full">
          <Popover open={showMention && filteredCollaborators.length > 0} onOpenChange={setShowMention}>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Type your comment here... Use '@' to mention a team member."
                className="min-h-[60px] pr-24"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !showMention) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute top-3 right-2 flex items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="ghost" size="icon" onClick={handleAttachClick}>
                  <Paperclip className="h-4 w-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <Button type="submit" size="icon" disabled={!message.trim() && !file}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
            <PopoverContent className="w-[250px] p-1" align="start" side="top">
              <div className="space-y-1">
                {filteredCollaborators.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleMentionSelect(c.name)}
                    className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.src} alt={c.name} />
                      <AvatarFallback>{c.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {file && (
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground bg-muted p-2 rounded-md">
              <span className="truncate pr-2">{file.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveAttachment}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove attachment</span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;