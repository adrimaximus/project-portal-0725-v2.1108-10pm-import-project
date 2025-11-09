import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, X, Check } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

export const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [text, setText] = useState('');
  const { editingMessage, setEditingMessage, editMessage } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      textareaRef.current?.focus();
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (text.trim()) {
      if (editingMessage) {
        editMessage(editingMessage.id, text);
        setEditingMessage(null);
      } else {
        onSendMessage(text);
      }
      setText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setText('');
  };

  return (
    <div className="p-4 border-t bg-background">
      {editingMessage && (
        <div className="mb-2 p-2 bg-muted rounded-md border-l-2 border-primary">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-primary">Edit Message</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{editingMessage.text}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="pr-24"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={handleSend} className="rounded-full bg-green-500 hover:bg-green-600">
            {editingMessage ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};