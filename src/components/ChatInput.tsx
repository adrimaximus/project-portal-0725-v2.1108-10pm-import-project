import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Paperclip, Send, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Attachment } from "@/types";

interface ChatInputProps {
  onSendMessage: (text: string, attachment: Attachment | null) => void;
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const { user: currentUser } = useAuth();

  const handleSend = () => {
    if ((!text.trim() && !attachment) || !currentUser) return;
    onSendMessage(text, attachment);
    setText("");
    setAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "file",
        url: URL.createObjectURL(file),
        size: file.size,
      });
    }
  };

  return (
    <div className="border-t p-4">
      <div className="relative">
        <Textarea
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="pr-24"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="h-5 w-5" />
              <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
            </label>
          </Button>
          <Button size="icon" onClick={handleSend}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {attachment && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <Paperclip className="h-4 w-4" />
          <span>{attachment.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachment(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;