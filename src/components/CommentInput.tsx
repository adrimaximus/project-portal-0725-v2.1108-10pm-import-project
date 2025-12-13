import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Ticket, Paperclip, X, Users, UploadCloud } from "lucide-react";
import { getInitials, generatePastelColor, getAvatarUrl, cn } from "@/lib/utils";
import { MentionsInput, Mention } from 'react-mentions';
import '@/styles/mentions.css';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import InteractiveText from './InteractiveText';
import SafeLocalStorage from '@/lib/localStorage';
import { User, Comment as CommentType } from "@/types";

interface CommentInputProps {
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null) => void;
  allUsers: User[];
  initialValue?: string;
  replyTo?: CommentType | null;
  onCancelReply?: () => void;
  storageKey: string;
}

export interface CommentInputHandle {
  setText: (newText: string, append?: boolean) => void;
  focus: () => void;
  scrollIntoView: () => void;
}

const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(({ onAddCommentOrTicket, allUsers, initialValue, replyTo, onCancelReply, storageKey }: CommentInputProps, ref) => {
  const { user } = useAuth();
  
  const [text, setText] = useState(() => {
    if (storageKey) {
      try {
        const savedText = SafeLocalStorage.getItem<string>(storageKey);
        return savedText || initialValue || '';
      } catch (error) {
        console.error("Failed to read from localStorage", error);
        return initialValue || '';
      }
    }
    return initialValue || '';
  });

  const [isTicket, setIsTicket] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionsInputRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    setText: (newText: string, append: boolean = false) => {
      setText(prev => append ? `${prev}${newText}` : newText);
    },
    focus: () => {
      if (mentionsInputRef.current && typeof mentionsInputRef.current.focus === 'function') {
         mentionsInputRef.current.focus();
      } else {
         // Fallback if ref method not available
         const input = containerRef.current?.querySelector('textarea');
         input?.focus();
      }
    },
    scrollIntoView: () => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }));

  useEffect(() => {
    if (storageKey) {
      try {
        SafeLocalStorage.setItem(storageKey, text);
      } catch (error) {
        console.error("Failed to write to localStorage", error);
      }
    }
  }, [text, storageKey]);

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
    }
  }, [initialValue]);

  const parseMentions = (text: string): string[] => {
    const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const matches = text.matchAll(mentionRegex);
    const userIds = Array.from(matches, match => match[1]);
    return [...new Set(userIds)];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && attachments.length === 0) return;
    
    let finalText = text;
    
    // Replace @all with explicit mentions for all users
    if (finalText.match(/@\[[^\]]+\]\(all\)/)) {
        const allMentions = allUsers.map(u => `@[${u.name}](${u.id})`).join(' ');
        finalText = finalText.replace(/@\[[^\]]+\]\(all\)/g, allMentions);
    }

    const mentionedUserIds = parseMentions(finalText);
    onAddCommentOrTicket(finalText, isTicket, attachments, mentionedUserIds, replyTo?.id);
    setText('');
    setIsTicket(false);
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (storageKey) {
      try {
        SafeLocalStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Failed to remove from localStorage", error);
      }
    }
  };

  if (!user) return null;
  
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  const mentionData = [
    { 
        id: 'all', 
        display: 'all', 
        name: 'Everyone', 
        email: 'Notify everyone in this context', 
        initials: '@',
        avatar_url: undefined 
    },
    ...(allUsers || []).map(member => ({
        id: member.id,
        display: member.name,
        ...member
    }))
  ];

  return (
    <div ref={containerRef} className="flex items-end space-x-3 w-full">
      <Avatar className="w-8 h-8 shrink-0 mb-1 hidden sm:block">
        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
        <AvatarFallback style={generatePastelColor(user.id)}>
          {getInitials(fullName, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 w-full">
        {replyTo && (
          <div className="p-1.5 mb-1.5 bg-muted/60 rounded-md flex justify-between items-center text-xs">
            <div className="border-l-2 border-primary pl-2 overflow-hidden w-full">
              <p className="font-semibold text-primary">Replying to {replyTo.author.name}</p>
              <div className="text-muted-foreground line-clamp-1">
                <InteractiveText text={replyTo.text || ''} members={allUsers} />
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-6 w-6 flex-shrink-0 ml-1">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div 
          className={cn(
            "border rounded-xl focus-within:ring-1 focus-within:ring-ring relative transition-colors bg-background",
            isDragging && "border-primary bg-primary/5 ring-1 ring-primary"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px] z-50 rounded-lg pointer-events-none">
              <div className="text-primary font-medium flex items-center gap-2 bg-background p-3 rounded-lg shadow-sm border animate-in fade-in zoom-in-95 duration-200">
                <UploadCloud className="h-5 w-5" />
                Drop files here to attach
              </div>
            </div>
          )}
          <div className="min-h-[36px] max-h-[120px] overflow-y-auto w-full">
            <MentionsInput
              value={text}
              onChange={(event, newValue) => setText(newValue)}
              placeholder="Add a comment..."
              className="mentions-input w-full"
              a11ySuggestionsListLabel={"Suggested mentions"}
              inputRef={mentionsInputRef}
              style={{ width: '100%' }}
            >
              <Mention
                trigger="@"
                data={mentionData}
                markup="@[__display__](__id__)"
                displayTransform={(id, display) => `@${display}`}
                renderSuggestion={(suggestion: any, search, highlightedDisplay, index, focused) => (
                  <div className={`mention-suggestion ${focused ? 'focused' : ''}`}>
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                      <AvatarFallback style={generatePastelColor(suggestion.id)}>
                        {suggestion.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mention-suggestion-info">
                      <div className="font-medium text-sm">{highlightedDisplay}</div>
                      {suggestion.email && <div className="text-xs text-muted-foreground">{suggestion.email}</div>}
                    </div>
                  </div>
                )}
                style={{ 
                  backgroundColor: 'hsl(var(--primary) / 0.3)', 
                  color: 'transparent', 
                  fontWeight: 500,
                  padding: '0 1px',
                  borderRadius: '2px'
                }}
              />
            </MentionsInput>
          </div>
          {attachments.length > 0 && (
            <div className="px-2 pb-2 pt-1 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded-full group">
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => removeAttachment(index)}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="px-2 pb-1.5 flex justify-between items-center">
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Attach files</p>
                  </TooltipContent>
                </Tooltip>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-7 w-7", isTicket ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')} onClick={() => setIsTicket(!isTicket)}>
                      <Ticket className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isTicket ? 'Convert to comment' : 'Convert to ticket'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button 
                size="sm" 
                onClick={handleSubmit} 
                disabled={!text.trim() && attachments.length === 0} 
                className="h-7 px-3 text-xs"
            >
              {isTicket ? 'Create Ticket' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CommentInput;