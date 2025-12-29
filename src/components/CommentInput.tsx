import { useState, useRef, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
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
  dropUp?: boolean;
  placeholder?: string;
}

export interface CommentInputHandle {
  setText: (newText: string, append?: boolean) => void;
  focus: () => void;
  scrollIntoView: () => void;
}

const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(({ 
  onAddCommentOrTicket, 
  allUsers, 
  initialValue, 
  replyTo, 
  onCancelReply, 
  storageKey,
  dropUp = true,
  placeholder = "Add a comment..."
}, ref) => {
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
    
    if (finalText.match(/@\[[^\]]+\]\(all\)/)) {
        const allMentions = allUsers.map(u => `@[${u.name}](${u.id})`).join(' ');
        finalText = finalText.replace(/@\[[^\]]+\]\(all\)/g, allMentions);
    }

    const mentionedUserIds = parseMentions(finalText);
    
    // If we are replying to "Unknown User", treat it as a root comment
    let finalReplyToId = replyTo?.id;
    if (replyTo && (replyTo.author.name === 'Unknown User' || replyTo.author.name === 'Unknown')) {
      finalReplyToId = undefined;
    }

    onAddCommentOrTicket(finalText, isTicket, attachments, mentionedUserIds, finalReplyToId);
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

  const mentionData = useMemo(() => [
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
  ], [allUsers]);

  if (!user) return null;
  
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  const suggestionsStyle = dropUp 
    ? {
        bottom: '100%',
        top: 'auto',
        marginBottom: '8px',
      }
    : {
        top: '100%',
        bottom: 'auto',
        marginTop: '8px',
      };

  const showReplyBanner = replyTo && replyTo.author.name !== 'Unknown User' && replyTo.author.name !== 'Unknown';

  return (
    <div ref={containerRef} className="flex items-end space-x-3 w-full">
      <Avatar className="w-8 h-8 shrink-0 mb-1 hidden sm:block">
        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
        <AvatarFallback style={generatePastelColor(user.id)}>
          {getInitials(fullName, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 w-full">
        <div 
          className={cn(
            "border rounded-xl focus-within:ring-1 focus-within:ring-ring relative transition-colors bg-background",
            isDragging && "border-primary bg-primary/5 ring-1 ring-primary"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {showReplyBanner && (
            <div className="mx-2 mt-2 p-2 bg-muted/50 rounded-md border-l-4 border-primary flex justify-between items-start gap-2">
              <div className="overflow-hidden w-full text-xs">
                <p className="font-semibold text-primary mb-0.5">Replying to {replyTo!.author.name}</p>
                <div className="text-muted-foreground line-clamp-1">
                  <InteractiveText text={replyTo!.text || ''} members={allUsers} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-5 w-5 flex-shrink-0 -mt-1 -mr-1 hover:bg-background/50">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px] z-50 rounded-lg pointer-events-none">
              <div className="text-primary font-medium flex items-center gap-2 bg-background p-3 rounded-lg shadow-sm border animate-in fade-in zoom-in-95 duration-200">
                <UploadCloud className="h-5 w-5" />
                Drop files here to attach
              </div>
            </div>
          )}
          
          <div className="w-full relative">
            <MentionsInput
              value={text}
              onChange={(event, newValue) => setText(newValue)}
              placeholder={placeholder}
              className="mentions-input w-full"
              a11ySuggestionsListLabel={"Suggested mentions"}
              inputRef={mentionsInputRef}
              style={{ 
                width: '100%',
                suggestions: {
                  ...suggestionsStyle,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 -4px 12px -2px rgba(0, 0, 0, 0.1)',
                  backgroundColor: 'hsl(var(--popover))',
                  zIndex: 9999,
                  list: {
                    backgroundColor: 'hsl(var(--popover))',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '0.875rem',
                  },
                  item: {
                    padding: '6px 12px',
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    '&focused': {
                      backgroundColor: 'hsl(var(--accent))',
                      color: 'hsl(var(--accent-foreground))',
                    },
                  },
                }
              }}
            >
              <Mention
                trigger="@"
                data={mentionData}
                markup="@[__display__](__id__)"
                displayTransform={(id, display) => `@${display}`}
                renderSuggestion={(suggestion: any, search, highlightedDisplay, index, focused) => (
                  <div className={cn("mention-suggestion", focused && "focused")}>
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
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  color: 'transparent',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '0 1px',
                  borderRadius: '2px',
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