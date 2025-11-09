import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, X, Pencil, CornerUpLeft } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatInputProps {
  conversationId: string;
}

export const ChatInput = ({ conversationId }: ChatInputProps) => {
  const [text, setText] = useState('');
  const { 
    sendMessage, 
    editingMessage, 
    setEditingMessage,
    replyingTo,
    setReplyingTo
  } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
      setReplyingTo(null); // Can't edit and reply at the same time
      textareaRef.current?.focus();
    }
  }, [editingMessage, setReplyingTo]);

  useEffect(() => {
    if (replyingTo) {
      setEditingMessage(null); // Can't edit and reply at the same time
      textareaRef.current?.focus();
    }
  }, [replyingTo, setEditingMessage]);

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text, conversationId);
      setText('');
    }
  };

  const handleCancel = () => {
    if (editingMessage) setEditingMessage(null);
    if (replyingTo) setReplyingTo(null);
    setText('');
  };

  const ContextBar = () => {
    if (!editingMessage && !replyingTo) return null;

    const isEditing = !!editingMessage;
    const message = editingMessage || replyingTo;
    const title = isEditing ? "Editing Message" : `Replying to ${message?.sender.name}`;
    const Icon = isEditing ? Pencil : CornerUpLeft;

    return (
      <div className="flex items-center justify-between bg-muted p-2 rounded-t-md text-sm border-b">
        <div className="flex items-center gap-2 overflow-hidden">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground line-clamp-1">{message?.text}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4 border-t bg-background">
      <div className="rounded-lg border">
        <ContextBar />
        <div className="relative p-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="pr-12 border-none focus-visible:ring-0 shadow-none resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" className="absolute right-3 bottom-3" onClick={handleSend} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};