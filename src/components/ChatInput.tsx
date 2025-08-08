import { useState, useRef, FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Folder } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Collaborator } from "@/types";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Project } from "@/data/projects";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  members?: Collaborator[];
  projects?: Project[];
}

const ChatInput = ({ onSendMessage, members = [], projects = [] }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();
  const currentUser = {
    src: user?.avatar,
  };

  const [showPopover, setShowPopover] = useState(false);
  const [query, setQuery] = useState("");
  const [startIndex, setStartIndex] = useState(-1);
  const [mentionType, setMentionType] = useState<'user' | 'project' | null>(null);

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
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    let triggerChar: '@' | '/' | null = null;
    let triggerIndex = -1;

    if (atIndex > slashIndex) {
        triggerChar = '@';
        triggerIndex = atIndex;
    } else if (slashIndex > -1) {
        triggerChar = '/';
        triggerIndex = slashIndex;
    }

    if (triggerChar && triggerIndex !== -1) {
        const textAfterTrigger = textBeforeCursor.substring(triggerIndex + 1);
        const spaceAfterTrigger = textAfterTrigger.indexOf(' ');

        if (spaceAfterTrigger === -1) {
            setQuery(textAfterTrigger);
            setStartIndex(triggerIndex);
            setMentionType(triggerChar === '@' ? 'user' : 'project');
            setShowPopover(true);
            return;
        }
    }
    
    setShowPopover(false);
    setMentionType(null);
  };

  const handleSelect = (name: string) => {
    const text = message;
    const part1 = text.substring(0, startIndex);
    const part2 = text.substring(startIndex + 1 + query.length);
    
    const triggerChar = mentionType === 'user' ? '@' : '/';
    const newMessage = `${part1}${triggerChar}${name} ${part2}`;
    
    setMessage(newMessage);
    setShowPopover(false);
    setQuery("");
    setMentionType(null);

    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = startIndex + name.length + 2; // +1 for trigger, +1 for space
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredMembers = members.filter(
    (member) => member.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (project) => project.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-4 border-t bg-background">
      <Popover 
        open={showPopover && ((mentionType === 'user' && filteredMembers.length > 0) || (mentionType === 'project' && filteredProjects.length > 0))} 
        onOpenChange={setShowPopover}
      >
        <form onSubmit={handleSubmit} className="flex w-full items-start space-x-4">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={currentUser.src} alt="You" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <PopoverAnchor asChild>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your comment here... (@mention, /project)"
                  className="min-h-[60px] pr-24"
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !showPopover) {
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
            </PopoverAnchor>
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
          {mentionType === 'user' && (
            <Command>
              <CommandInput placeholder="Mention a team member..." value={query} onValueChange={setQuery} />
              <CommandList>
                <CommandEmpty>No members found.</CommandEmpty>
                {filteredMembers.map((member) => (
                  <CommandItem key={member.id} onSelect={() => handleSelect(member.name)}>
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={member.src} />
                      <AvatarFallback>{member.fallback}</AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          )}
          {mentionType === 'project' && (
            <Command>
              <CommandInput placeholder="Mention a project..." value={query} onValueChange={setQuery} />
              <CommandList>
                <CommandEmpty>No projects found.</CommandEmpty>
                {filteredProjects.map((project) => (
                  <CommandItem key={project.id} onSelect={() => handleSelect(project.name)}>
                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{project.name}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChatInput;