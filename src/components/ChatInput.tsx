import { useState, useRef, FormEvent, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";
import { currentUser } from "@/data/collaborators";
import { Collaborator } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  members?: Collaborator[];
}

const ChatInput = ({ onSendMessage, members = [] }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  useEffect(() => {
    if (mentionQuery.length > 0) {
      setShowMention(true);
    } else {
      setShowMention(false);
    }
  }, [mentionQuery]);

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
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const spaceAfterAtIndex = textBeforeCursor.indexOf(' ', atIndex);

    if (atIndex !== -1 && (spaceAfterAtIndex === -1 || spaceAfterAtIndex > cursorPosition)) {
      const query = textBeforeCursor.substring(atIndex + 1);
      setMentionQuery(query);
      setMentionStartIndex(atIndex);
    } else {
      setMentionQuery("");
      setShowMention(false);
    }
  };

  const handleMentionSelect = (name: string) => {
    const text = message;
    const part1 = text.substring(0, mentionStartIndex);
    const part2 = text.substring(mentionStartIndex + 1 + mentionQuery.length);
    const newMessage = `${part1}@${name} ${part2}`;
    
    setMessage(newMessage);
    setShowMention(false);
    setMentionQuery("");

    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = mentionStartIndex + name.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredMembers = members.filter(
    (member) => member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="p-4 border-t bg-background">
      <Popover open={showMention && members.length > 0 && filteredMembers.length > 0} onOpenChange={setShowMention}>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <form onSubmit={handleSubmit} className="flex w-full items-start space-x-4">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={currentUser.src} alt="You" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Type your comment here..."
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
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
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
        <PopoverContent className="w-72 p-0" side="top" align="start">
          <Command>
            <CommandInput placeholder="Mention a team member..." value={mentionQuery} onValueChange={setMentionQuery} />
            <CommandList>
              <CommandEmpty>No members found.</CommandEmpty>
              {filteredMembers.map((member) => (
                <CommandItem key={member.id} onSelect={() => handleMentionSelect(member.name)}>
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={member.src} />
                    <AvatarFallback>{member.fallback}</AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChatInput;