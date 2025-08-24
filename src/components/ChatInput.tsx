import { useRef, useState, forwardRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { Attachment } from "@/types";

interface ChatInputProps {
  onSendMessage: (text: string, attachment: File | null) => void;
  onTyping?: () => void;
  isSending: boolean;
  conversationId: string;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ onSendMessage, onTyping, isSending, conversationId }, ref) => {
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const lastTypingSentAtRef = useRef<number>(0);

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
    onSendMessage(text, attachmentFile);
    setText("");
    setAttachmentFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  return (
    <div className="border-t p-4 flex-shrink-0">
      <div className="relative">
        <Textarea
          ref={ref}
          placeholder="Type a message..."
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
          className="pr-24"
          disabled={isSending}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
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

export default ChatInput;