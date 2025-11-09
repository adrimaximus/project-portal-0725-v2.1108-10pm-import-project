import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, X, Pencil, CornerUpLeft, Paperclip } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { Message } from '@/types';
import VoiceMessageRecorder from './VoiceMessageRecorder';

interface ChatInputProps {
  onSendMessage: (text: string, attachment: File | null) => void;
  onTyping: () => void;
  isSending: boolean;
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, onTyping, isSending, conversationId, replyTo, onCancelReply }, ref) => {
    const [text, setText] = useState('');
    const { editingMessage, setEditingMessage } = useChatContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    useEffect(() => {
      if (editingMessage) {
        setText(editingMessage.text || '');
        textareaRef.current?.focus();
      }
    }, [editingMessage]);

    const handleSend = () => {
      if (text.trim() || attachment) {
        onSendMessage(text, attachment);
        setText('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    const handleCancel = () => {
      if (editingMessage) setEditingMessage(null);
      if (replyTo) onCancelReply();
      setText('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setAttachment(e.target.files[0]);
      }
    };

    const ContextBar = () => {
      if (!editingMessage && !replyTo) return null;
      const isEditing = !!editingMessage;
      const message = editingMessage || replyTo;
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
          {attachment && (
            <div className="p-2 border-b flex items-center justify-between">
              <span className="text-sm text-muted-foreground truncate">
                Attached: {attachment.name}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="relative p-2 flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTyping();
              }}
              placeholder="Type a message..."
              className="pr-24 border-none focus-visible:ring-0 shadow-none resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <div className="flex items-center gap-1">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <VoiceMessageRecorder onSend={setAttachment} disabled={isSending} />
              <Button size="icon" onClick={handleSend} disabled={(!text.trim() && !attachment) || isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);