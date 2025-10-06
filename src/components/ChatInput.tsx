import { useState, useRef, useEffect } from "react";
import { Smile, Send } from "lucide-react";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export default function ChatInput({ value, onChange, onSend, isSending }: ChatInputProps) {
  const [showPicker, setShowPicker] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-4 border-t bg-background">
      <div className="relative flex-1">
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="resize-none pr-10"
          rows={1}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPicker((v) => !v)}
          className="absolute right-1 bottom-1 h-8 w-8"
        >
          <Smile className="w-5 h-5" />
        </Button>
        {showPicker && (
          <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 z-50">
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => {
                onChange(value + emoji.native)
                inputRef.current?.focus()
              }}
              theme="light"
              previewPosition="none"
            />
          </div>
        )}
      </div>
      <Button onClick={onSend} disabled={isSending || !value.trim()} size="icon" className="flex-shrink-0">
        <Send className="w-5 h-5" />
      </Button>
    </div>
  )
}