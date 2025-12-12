import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Paperclip, Send, X, Loader2, UploadCloud, Smile, Camera, Mic, Check, Pencil } from "lucide-react";
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
  const storageKey = `chat-draft:${conversationId}`;
  const [text, setText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
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

    onSendMessage(finalText, attachmentFile, replyTo?.id);
    setText("");
    setAttachmentFile(null);
    SafeLocalStorage.removeItem(storageKey);
  };

  const handleSendVoiceMessage = (file: File) => {
    onSendMessage("", file, replyTo?.id);
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

  return (
    <div {...getRootProps()} className="border-t p-2 md:p-4 flex-shrink-0 relative bg-background safe-area-bottom">
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
        {text.trim() || attachmentFile ? (
          <Button size="icon" onClick={handleSend} disabled={isSending} className="h-10 w-10 flex-shrink-0">
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingMessage ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />)}
          </Button>
        ) : (
          <VoiceMessageRecorder onSend={handleSendVoiceMessage} disabled={isSending} />
        )}
      </div>
      {attachmentFile && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <Paperclip className="h-4 w-4" />
          <span className="truncate flex-1">{attachmentFile.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto flex-shrink-0" onClick={() => setAttachmentFile(null)} disabled={isSending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});