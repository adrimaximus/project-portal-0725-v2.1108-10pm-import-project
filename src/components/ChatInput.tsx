import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Attachment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (text: string, attachment: Attachment | null) => void;
  onTyping?: () => void;
}

const ChatInput = ({ conversationId, onSendMessage, onTyping }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user: currentUser } = useAuth();
  const lastTypingSentAtRef = useRef<number>(0);

  const triggerTyping = () => {
    const now = Date.now();
    if (onTyping && now - lastTypingSentAtRef.current > 800) {
      lastTypingSentAtRef.current = now;
      onTyping();
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !attachmentFile) || !currentUser) return;

    setIsUploading(true);
    let finalAttachment: Attachment | null = null;

    if (attachmentFile) {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${currentUser.id}/${conversationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, attachmentFile);

      if (uploadError) {
        toast.error("Failed to upload attachment.", { description: uploadError.message });
        setIsUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
      
      finalAttachment = {
        name: attachmentFile.name,
        type: attachmentFile.type.startsWith("image/") ? "image" : "file",
        url: urlData.publicUrl,
      };
    }

    onSendMessage(text, finalAttachment);
    setText("");
    setAttachmentFile(null);
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  return (
    <div className="border-t p-4">
      <div className="relative">
        <Textarea
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
          disabled={isUploading}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild disabled={isUploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="h-5 w-5" />
              <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
            </label>
          </Button>
          <Button size="icon" onClick={handleSend} disabled={isUploading || (!text.trim() && !attachmentFile)}>
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {attachmentFile && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <Paperclip className="h-4 w-4" />
          <span>{attachmentFile.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachmentFile(null)} disabled={isUploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;