import { useRef, useState, forwardRef, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Paperclip, Send, X, Loader2, UploadCloud, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types";
import VoiceMessageRecorder from "./VoiceMessageRecorder";
import MentionInput, { UserSuggestion, ProjectSuggestion } from "./MentionInput";
import { useChatContext } from "@/contexts/ChatContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from "@/contexts/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import * as chatApi from '@/lib/chatApi';

interface ChatInputProps {
  onSendMessage: (text: string, attachment: File | null, replyToMessageId?: string | null) => void;
  onTyping?: () => void;
  isSending: boolean;
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ 
  onSendMessage, 
  onTyping, 
  isSending, 
  conversationId,
  replyTo,
  onCancelReply,
}, ref) => {
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const lastTypingSentAtRef = useRef<number>(0);
  const { selectedConversation } = useChatContext();
  const { theme } = useTheme();

  const [isProjectMentionActive, setIsProjectMentionActive] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [debouncedProjectSearchTerm, setDebouncedProjectSearchTerm] = useState('');

  const { data: projectSuggestionsData } = useQuery({
    queryKey: ['project-search', debouncedProjectSearchTerm],
    queryFn: () => chatApi.searchProjects(debouncedProjectSearchTerm),
    enabled: isProjectMentionActive,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProjectSearchTerm(projectSearchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [projectSearchTerm]);

  const handleSearchTermChange = (trigger: '@' | '/' | null, term: string) => {
    if (trigger === '/') {
      setIsProjectMentionActive(true);
      setProjectSearchTerm(term);
    } else {
      setIsProjectMentionActive(false);
      setProjectSearchTerm('');
    }
  };

  const projectSuggestions: ProjectSuggestion[] = (projectSuggestionsData || []).map(p => ({
    id: p.id,
    display: p.name,
    slug: p.slug,
  }));

  const userSuggestions: UserSuggestion[] = (selectedConversation?.members || []).map(m => ({
    id: m.id,
    display: m.name,
    avatar_url: m.avatar_url,
    initials: m.initials,
  }));

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setAttachmentFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: false,
  });

  const triggerTyping = () => {
    if (onTyping) {
      const now = Date.now();
      if (now - lastTypingSentAtRef.current > 800) {
        lastTypingSentAtRef.current = now;
        onTyping();
      }
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !attachmentFile) return;
    onSendMessage(text, attachmentFile, replyTo?.id);
    setText("");
    setAttachmentFile(null);
    onCancelReply();
  };

  const handleSendVoiceMessage = (file: File) => {
    onSendMessage("", file, replyTo?.id);
    onCancelReply();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    triggerTyping();
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      triggerTyping();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setText(prev => prev + emoji.native);
  };

  return (
    <div {...getRootProps()} className="border-t p-4 flex-shrink-0 relative">
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 border-2 border-dashed border-primary rounded-lg m-4">
          <UploadCloud className="h-10 w-10 text-primary" />
          <p className="mt-2 text-lg font-medium text-primary">Drop file to attach</p>
        </div>
      )}

      {replyTo && (
        <div className="p-2 mb-2 bg-muted rounded-md flex justify-between items-center">
          <div className="text-sm overflow-hidden">
            <p className="font-semibold text-primary">Replying to {replyTo.sender.name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <MentionInput
            ref={ref}
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            userSuggestions={userSuggestions}
            projectSuggestions={projectSuggestions}
            onSearchTermChange={handleSearchTermChange}
            disabled={isSending}
            className="pr-24"
          />
          <div className="absolute bottom-2 right-2 flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isSending}>
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  previewPosition="none"
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" asChild disabled={isSending}>
              <label htmlFor={`file-upload-${conversationId}`} className="cursor-pointer">
                <Paperclip className="h-5 w-5" />
                <input 
                  id={`file-upload-${conversationId}`} 
                  type="file" 
                  className="sr-only" 
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
              </label>
            </Button>
          </div>
        </div>
        {text.trim() || attachmentFile ? (
          <Button size="icon" onClick={handleSend} disabled={isSending}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        ) : (
          <VoiceMessageRecorder onSend={handleSendVoiceMessage} disabled={isSending} />
        )}
      </div>
      {attachmentFile && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <Paperclip className="h-4 w-4" />
          <span>{attachmentFile.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachmentFile(null)} disabled={isSending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});