import { useRef, useState, forwardRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Paperclip, Send, X, Loader2, UploadCloud, Smile, Camera, Mic, Check, Pencil, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types";
import VoiceMessageRecorder from "./VoiceMessageRecorder";
import MentionInput, { UserSuggestion, ProjectSuggestion, TaskSuggestion, BillSuggestion } from "./MentionInput";
import { useChatContext } from "@/contexts/ChatContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from "@/contexts/ThemeProvider";
import InteractiveText from './InteractiveText';
import SafeLocalStorage from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: File[], replyToMessageId?: string | null) => void;
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
  const storageKey = `chat-draft:${conversationId}`;
  const [text, setText] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const lastTypingSentAtRef = useRef<number>(0);
  const { selectedConversation, projectSuggestions, taskSuggestions, billSuggestions } = useChatContext();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const mentionsInputRef = useRef<any>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      onCancelReply(); // Can't edit and reply at the same time
      if (mentionsInputRef.current?.inputElement) {
        mentionsInputRef.current.inputElement.focus();
      }
    } else {
      // When conversation changes or editing is cancelled, restore draft
      const savedDraft = SafeLocalStorage.getItem(storageKey, '');
      setText(savedDraft || '');
    }
  }, [editingMessage, onCancelReply, conversationId, storageKey]);

  const userSuggestions: UserSuggestion[] = (selectedConversation?.members || []).map(m => ({
    id: m.id,
    display: m.name,
    avatar_url: m.avatar_url,
    initials: m.initials,
    email: m.email,
  }));

  const projectSuggestionData: ProjectSuggestion[] = (projectSuggestions || []).map(p => ({ id: p.id, display: p.name, slug: p.slug }));
  const taskSuggestionData: TaskSuggestion[] = (taskSuggestions || []).map(t => ({ id: t.id, display: t.title, project_slug: t.project_slug }));
  const billSuggestionData: BillSuggestion[] = (billSuggestions || []).map(b => ({ id: b.id, display: b.name, slug: b.slug }));

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setAttachmentFiles(prev => [...prev, ...acceptedFiles]);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
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
    if (!text.trim() && attachmentFiles.length === 0) return;

    let finalText = text;

    // Handle @all expansion for Chat
    if (finalText.match(/@\[[^\]]+\]\(all\)/)) {
       const members = selectedConversation?.members || [];
       const validMembers = members.filter(m => 
         m.id !== 'ai-assistant' && 
         m.id !== 'all' && 
         m.id !== currentUser?.id
       );
       const allMentions = validMembers.map(u => `@[${u.name}](${u.id})`).join(' ');
       finalText = finalText.replace(/@\[[^\]]+\]\(all\)/g, allMentions);
    }

    onSendMessage(finalText, attachmentFiles, replyTo?.id);
    setText("");
    setAttachmentFiles([]);
    SafeLocalStorage.removeItem(storageKey);
  };

  const handleSendVoiceMessage = (file: File) => {
    onSendMessage("", [file], replyTo?.id);
    onCancelReply();
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (!editingMessage) {
      SafeLocalStorage.setItem(storageKey, newText);
    }
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
    const newText = text + emoji.native;
    handleTextChange(newText);
  };

  const removeFile = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div {...getRootProps()} className="border-t p-2 md:p-4 flex-shrink-0 relative bg-background safe-area-bottom">
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 border-2 border-dashed border-primary rounded-lg m-4">
          <UploadCloud className="h-10 w-10 text-primary" />
          <p className="mt-2 text-lg font-medium text-primary">Drop files to attach</p>
        </div>
      )}

      {editingMessage && (
        <div className="p-2 mb-2 bg-muted rounded-md flex justify-between items-start gap-2">
          <div className="flex-1 flex items-start gap-3 overflow-hidden">
            <Pencil className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 text-sm overflow-hidden">
              <p className="font-semibold text-primary">Editing Message</p>
              <p className="text-xs text-muted-foreground truncate">
                <InteractiveText text={editingMessage.text || ''} members={selectedConversation?.members || []} />
              </p>
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
                  <p className="line-clamp-3 break-words">
                    <InteractiveText text={replyTo.text} members={selectedConversation?.members || []} />
                  </p>
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
        <div className="relative flex-1 min-w-0">
          <MentionInput
            ref={ref}
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            userSuggestions={userSuggestions}
            projectSuggestions={projectSuggestionData}
            taskSuggestions={taskSuggestionData}
            billSuggestions={billSuggestionData}
            disabled={isSending}
            className="pr-24 min-h-[40px] max-h-[120px]"
          />
          <div className="absolute bottom-1 right-1 flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isSending} className="h-8 w-8">
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none" side="top" align="end">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  previewPosition="none"
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={open} disabled={isSending} className="h-8 w-8">
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {text.trim() || attachmentFiles.length > 0 ? (
          <Button size="icon" onClick={handleSend} disabled={isSending} className="h-10 w-10 flex-shrink-0">
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingMessage ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />)}
          </Button>
        ) : (
          <VoiceMessageRecorder onSend={handleSendVoiceMessage} disabled={isSending} />
        )}
      </div>
      
      {attachmentFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {attachmentFiles.map((file, index) => {
            const isImg = file.type.startsWith('image/');
            const previewUrl = URL.createObjectURL(file);
            
            return (
              <div key={index} className="w-[60px] h-[60px] relative group">
                <div className={cn(
                  "w-full h-full rounded-md overflow-hidden border border-border/50 bg-background relative",
                  !isImg && "bg-muted/30 flex flex-col items-center justify-center p-1"
                )}>
                  {isImg ? (
                    <img 
                      src={previewUrl} 
                      alt={file.name} 
                      className="w-full h-full object-cover" 
                      onLoad={() => URL.revokeObjectURL(previewUrl)}
                    />
                  ) : (
                    <>
                      {file.type === 'application/pdf' ? (
                        <FileText className="h-6 w-6 text-red-500 mb-0.5" />
                      ) : (
                        <Paperclip className="h-6 w-6 text-muted-foreground mb-0.5" />
                      )}
                      <span className="text-[8px] text-muted-foreground w-full truncate px-0.5 text-center">
                        {file.name}
                      </span>
                    </>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});