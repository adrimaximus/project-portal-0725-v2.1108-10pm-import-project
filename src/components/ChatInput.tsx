import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Paperclip, Send, X, Loader2, UploadCloud, Smile, Camera, Mic, Check, Pencil } from "lucide-react";
import { cn, formatMentionsForDisplay } from "@/lib/utils";
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
  editingMessage: Message | null;
  onCancelEdit: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ 
  onSendMessage, 
  onTyping, 
  isSending, 
  conversationId,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}, ref) => {
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const lastTypingSentAtRef = useRef<number>(0);
  const { selectedConversation } = useChatContext();
  const { theme } = useTheme();
  const mentionsInputRef = useRef<any>(null);

  const [isProjectMentionActive, setIsProjectMentionActive] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [debouncedProjectSearchTerm, setDebouncedProjectSearchTerm] = useState('');

  const { data: projectSuggestionsData } = useQuery({
    queryKey: ['project-search', debouncedProjectSearchTerm],
    queryFn: () => chatApi.searchProjects(debouncedProjectSearchTerm),
    enabled: isProjectMentionActive,
  });

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      onCancelReply(); // Can't edit and reply at the same time
      if (mentionsInputRef.current?.inputElement) {
        mentionsInputRef.current.inputElement.focus();
      }
    }
  }, [editingMessage, onCancelReply]);

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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
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
  };

  const handleSendVoiceMessage = (file: File) => {
    onSendMessage("", file, replyTo?.id);
    onCancelReply();
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

      {editingMessage && (
        <div className="p-2 mb-2 bg-muted rounded-md flex justify-between items-start gap-2">
          <div className="flex-1 flex items-start gap-3 overflow-hidden">
            <Pencil className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 text-sm overflow-hidden">
              <p className="font-semibold text-primary">Editing Message</p>
              <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: formatMentionsForDisplay(editingMessage.text || '') }} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelEdit} className="h-7 w-7 flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {replyTo && !editingMessage && (
        <div className="p-2 mb-2 bg-muted rounded-md flex justify-between items-start gap-2">
          <div className="flex-1 flex items-start gap-3 overflow-hidden">
            <div className="flex-1 text-sm overflow-hidden">
              <p className="font-semibold text-primary">Replying to {replyTo.sender.name}</p>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                {replyTo.attachment?.type.startsWith('image/') && <Camera className="h-3 w-3 flex-shrink-0" />}
                {replyTo.attachment?.type.startsWith('audio/') && <Mic className="h-3 w-3 flex-shrink-0" />}
                {replyTo.text ? (
                  <p className="truncate" dangerouslySetInnerHTML={{ __html: formatMentionsForDisplay(replyTo.text) }} />
                ) : (
                  replyTo.attachment?.type.startsWith('image/') ? 'Photo' : replyTo.attachment?.type.startsWith('audio/') ? 'Voice message' : 'Attachment'
                )}
              </div>
            </div>
            {replyTo.attachment?.type.startsWith('image/') && (
              <img src={replyTo.attachment.url} alt="Reply preview" className="h-10 w-10 object-cover rounded-md flex-shrink-0" />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7 flex-shrink-0">
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
            <Button variant="ghost" size="icon" onClick={open} disabled={isSending}>
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {text.trim() || attachmentFile ? (
          <Button size="icon" onClick={handleSend} disabled={isSending}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingMessage ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />)}
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