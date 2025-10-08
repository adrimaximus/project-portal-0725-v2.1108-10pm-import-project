import { useRef, useState, forwardRef } from "react";
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Paperclip, Send, X, Loader2, UploadCloud, Smile, Briefcase } from "lucide-react";
import { Message } from "@/types";
import VoiceMessageRecorder from "./VoiceMessageRecorder";
import { useChatContext } from "@/contexts/ChatContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from "@/contexts/ThemeProvider";
import * as chatApi from '@/lib/chatApi';
import { Mention } from 'primereact/mention';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (text: string, attachment: File | null, replyToMessageId?: string | null) => void;
  onTyping?: () => void;
  isSending: boolean;
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export const ChatInput = forwardRef<Mention, ChatInputProps>(({ 
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
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const userSuggestions = ((selectedConversation as any)?.participants || []).map((m: any) => ({
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

  const handleTextChange = (e: any) => {
    setText(e.target.value);
    triggerTyping();
  };

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

  const onSearch = (event: { query: string, trigger: string }) => {
    const trigger = event.trigger;
    const query = event.query;

    if (trigger === '@') {
      setTimeout(() => {
        let suggestions;
        if (!query.trim().length) {
          suggestions = [...userSuggestions];
        } else {
          suggestions = userSuggestions.filter((user) =>
            user.display.toLowerCase().startsWith(query.toLowerCase())
          );
        }
        setSuggestions(suggestions);
      }, 250);
    } else if (trigger === '/') {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }
      chatApi.searchProjects(query).then(projects => {
        const projectSuggestions = projects.map(p => ({ id: p.slug, display: p.name }));
        setSuggestions(projectSuggestions);
      });
    }
  };

  const itemTemplate = (suggestion: any, options: { trigger: string }) => {
    const trigger = options.trigger;

    if (trigger === '@') {
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
            <AvatarFallback style={generatePastelColor(suggestion.id)}>{suggestion.initials}</AvatarFallback>
          </Avatar>
          <span>{suggestion.display}</span>
        </div>
      );
    } else if (trigger === '/') {
      return (
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{suggestion.display}</span>
        </div>
      );
    }
    return null;
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
            <p className="font-semibold text-primary">Replying to {(replyTo as any).sender_first_name}</p>
            <p className="text-xs text-muted-foreground truncate">{(replyTo as any).content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <div className="w-full rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Mention
              ref={ref}
              placeholder="Type a message..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              trigger={['@', '/']}
              suggestions={suggestions}
              onSearch={onSearch}
              field="display"
              itemTemplate={itemTemplate}
              rows={1}
              autoResize
              className="w-full"
              inputClassName="w-full p-3 pr-24 bg-transparent placeholder:text-muted-foreground focus:outline-none resize-none"
            />
          </div>
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