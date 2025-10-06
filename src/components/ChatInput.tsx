import { useState, useRef, useEffect, forwardRef } from "react";
import { Smile, Send, Paperclip, X } from "lucide-react";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Message } from "@/types";
import VoiceMessageRecorder from "./VoiceMessageRecorder";

interface ChatInputProps {
  onSendMessage: (text: string, attachmentFile: File | null, replyToMessageId?: string | null) => void;
  onTyping?: () => void;
  isSending: boolean;
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ onSendMessage, onTyping, isSending, conversationId, replyTo, onCancelReply }, ref) => {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);

  const handleSend = () => {
    if (isSending || (!text.trim() && !attachment)) return;
    onSendMessage(text, attachment, replyTo?.id);
    setText("");
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (onTyping) {
      onTyping();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleVoiceSend = (file: File) => {
    onSendMessage("", file);
  };

  const handleEmojiSelect = (emoji: any) => {
    setText(prev => prev + emoji.native);
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.focus();
    }
  };

  return (
    <div className="p-4 border-t bg-background flex-shrink-0">
      {replyTo && (
        <div className="mb-2 p-2 bg-muted rounded-md text-sm flex justify-between items-center">
          <div>
            <p className="font-semibold">Replying to {replyTo.sender.name}</p>
            <p className="text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply}><X className="h-4 w-4" /></Button>
        </div>
      )}
      {attachment && (
        <div className="mb-2 p-2 bg-muted rounded-md text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span>{attachment.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setAttachment(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <div className="relative flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none pr-20 min-h-[40px]"
            rows={1}
            disabled={isSending}
          />
          <div className="absolute right-1 bottom-1 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPicker((v) => !v)}
              className="h-8 w-8"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
          {showPicker && (
            <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 z-50">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
              />
            </div>
          )}
        </div>
        {text.trim() ? (
          <Button onClick={handleSend} disabled={isSending} size="icon" className="flex-shrink-0">
            <Send className="w-5 h-5" />
          </Button>
        ) : (
          <VoiceMessageRecorder onSend={handleVoiceSend} disabled={isSending} />
        )}
      </div>
    </div>
  );
});

export default ChatInput;