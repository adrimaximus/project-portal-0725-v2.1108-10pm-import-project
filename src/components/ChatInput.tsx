import { useTheme } from "@/contexts/ThemeProvider";
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Message } from "@/types/chat";

interface ChatInputProps {
    onSendMessage: (text: string, attachmentFile: File | null) => void;
    onTyping?: () => void;
    isSending: boolean;
    conversationId: string;
    replyTo: Message | null;
    onCancelReply: () => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
    ({ onSendMessage, onTyping, isSending, replyTo, onCancelReply }, ref) => {
    const { mode } = useTheme();
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const internalRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => internalRef.current!);

    const handleEmojiSelect = (emoji: any) => {
        setText(prev => prev + emoji.native);
        internalRef.current?.focus();
    }

    const handleSend = () => {
        if (text.trim() || file) {
            onSendMessage(text, file);
            setText("");
            setFile(null);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (onTyping) {
            onTyping();
        }
    }
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    }

    return (
        <div className="p-4 border-t bg-background">
            {replyTo && (
                <div className="p-2 mb-2 bg-muted rounded-md text-sm relative">
                    <div className="font-bold text-primary">Replying to {replyTo.sender?.name}</div>
                    <p className="text-muted-foreground truncate">{replyTo.content}</p>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={onCancelReply}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {file && (
                 <div className="p-2 mb-2 bg-muted rounded-md text-sm relative">
                    <div className="font-bold text-primary">Attachment</div>
                    <p className="text-muted-foreground truncate">{file.name}</p>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setFile(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div className="relative">
                <Textarea 
                    ref={internalRef}
                    placeholder="Type a message..." 
                    className="pr-28" 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                />
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button variant="ghost" size="icon" onClick={handleAttachmentClick} disabled={isSending}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isSending}>
                                <Smile className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto border-0 mb-2">
                            <Picker 
                                data={data} 
                                onEmojiSelect={handleEmojiSelect}
                                theme={mode === 'system' ? 'auto' : mode}
                                previewPosition="none"
                            />
                        </PopoverContent>
                    </Popover>
                    <Button size="icon" onClick={handleSend} disabled={isSending || (!text.trim() && !file)}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
});