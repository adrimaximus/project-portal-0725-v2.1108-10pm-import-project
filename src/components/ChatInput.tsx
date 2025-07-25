import { useState, useRef, FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() || file) {
      onSendMessage(message, file ?? undefined);
      setMessage("");
      handleRemoveAttachment();
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      <form onSubmit={handleSubmit} className="flex w-full items-start space-x-4">
        <Avatar className="h-9 w-9 border">
          <AvatarImage src="https://i.pravatar.cc/150?u=currentuser" alt="You" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
        <div className="w-full">
          <div className="relative">
            <Textarea
              placeholder="Type your comment here..."
              className="min-h-[60px] pr-24"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute top-3 right-2 flex items-center">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="ghost" size="icon" onClick={handleAttachClick}>
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
          {file && (
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground bg-muted p-2 rounded-md">
              <span className="truncate pr-2">{file.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveAttachment}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove attachment</span>
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;