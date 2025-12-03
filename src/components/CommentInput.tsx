import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { User, Comment as CommentType } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Ticket, Paperclip, X, Users, UploadCloud } from "lucide-react";
import { getInitials, generatePastelColor, getAvatarUrl, cn } from "@/lib/utils";
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import '@/styles/mentions.css';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import InteractiveText from './InteractiveText';
import SafeLocalStorage from '@/lib/localStorage';

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
      mentionsInputRef.current?.inputElement?.focus();
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
    <div ref={containerRef} className="flex items-start space-x-4">
      <Avatar>
        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
        <AvatarFallback style={generatePastelColor(user.id)}>
          {getInitials(fullName, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {replyTo && (
          <div className="p-2 mb-2 bg-muted rounded-md flex justify-between items-center text-sm">
            <div className="border-l-2 border-primary pl-2 overflow-hidden w-full">
              <p className="font-semibold text-primary">Replying to {replyTo.author.name}</p>
              <div className="text-xs text-muted-foreground line-clamp-3">
                <InteractiveText text={replyTo.text || ''} members={allUsers} />
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7 flex-shrink-0 ml-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div 
          className={cn(
            "border rounded-lg focus-within:ring-1 focus-within:ring-ring relative transition-colors",
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
          <MentionsInput
            value={text}
            onChange={(event, newValue) => setText(newValue)}
            placeholder="Add a comment or create a ticket... Type @ to mention a team member."
            className="mentions-input"
            a11ySuggestionsListLabel={"Suggested mentions"}
            inputRef={mentionsInputRef}
          >
            <Mention
              trigger="@"
              data={mentionData}
              markup="@[__display__](__id__)"
              displayTransform={(id, display) => `@${display}`}
              renderSuggestion={(suggestion: SuggestionDataItem & { avatar_url?: string, initials?: string, email?: string }, search, highlightedDisplay, index, focused) => (
                <div className={`mention-suggestion ${focused ? 'focused' : ''}`}>
                  {suggestion.id === 'all' ? (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id as string)} />
                        <AvatarFallback style={generatePastelColor(suggestion.id as string)}>
                        {suggestion.initials}
                        </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="mention-suggestion-info">
                    <div className="font-medium">{highlightedDisplay}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.email}</div>
                  </div>
                </div>
              )}
            />
          </MentionsInput>
          {attachments.length > 0 && (
            <div className="p-3 border-t">
              <p className="text-sm font-medium mb-2">Attachments</p>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md group">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAttachment(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-2 border-t flex justify-between items-center bg-muted/20 rounded-b-lg">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
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
                    <Button variant="ghost" size="icon" onClick={() => setIsTicket(!isTicket)} className={isTicket ? 'bg-primary/10 text-primary' : ''}>
                      <Ticket className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isTicket ? 'Convert to comment' : 'Convert to ticket'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button onClick={handleSubmit} disabled={!text.trim() && attachments.length === 0}>
              {isTicket ? 'Create Ticket' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CommentInput;