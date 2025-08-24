import { useRef, useState, forwardRef, useCallback, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Paperclip, Send, X, Loader2, UploadCloud, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types";

interface ChatInputProps {
  onSendMessage: (text: string, attachment: File | null, replyToMessageId?: string | null) => void;
  onTyping?: () => void;
  isSending: boolean;
  conversationId: string;
  isListening?: boolean;
  onToggleListening?: () => void;
  isSpeechRecognitionSupported?: boolean;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ 
  onSendMessage, 
  onTyping, 
  isSending, 
  conversationId,
  isListening,
  onToggleListening,
  isSpeechRecognitionSupported,
  replyTo,
  onCancelReply,
}, ref) => {
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const lastTypingSentAtRef = useRef<number>(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setAttachmentFile(acceptedFiles[0]);
    }
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  // This allows the parent component to update the text (e.g., from speech recognition)
  useEffect(() => {
    if (typeof ref === 'object' && ref?.current) {
      (ref.current as any).setText = setText;
    }
  }, [ref]);

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

      <div className="relative">
        <Textarea
          ref={ref}
          placeholder="Type a message or drop a file..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            triggerTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            } else {
              triggerTyping();
            }
          }}
          className="pr-36"
          disabled={isSending}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {isSpeechRecognitionSupported && onToggleListening && (
            <Button variant="ghost" size="icon" onClick={onToggleListening} disabled={isSending}>
              {isListening ? <MicOff className="h-5 w-5 text-red-500 animate-pulse" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild disabled={isSending}>
            <label htmlFor={`file-upload-${conversationId}`} className="cursor-pointer">
              <Paperclip className="h-5 w-5" />
              <input id={`file-upload-${conversationId}`} type="file" className="sr-only" onChange={handleFileChange} />
            </label>
          </Button>
          <Button size="icon" onClick={handleSend} disabled={isSending || (!text.trim() && !attachmentFile)}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
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