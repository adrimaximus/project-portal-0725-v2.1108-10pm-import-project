import { useRef, useState, forwardRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Attachment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";

interface ChatInputProps {}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>((props, ref) => {
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user: currentUser } = useAuth();
  const { selectedConversation, sendMessage, sendTyping, isSendingMessage } = useChatContext();
  const lastTypingSentAtRef = useRef<number>(0);

  const triggerTyping = () => {
    if (selectedConversation?.id === 'ai-assistant') return;
    const now = Date.now();
    if (now - lastTypingSentAtRef.current > 800) {
      lastTypingSentAtRef.current = now;
      sendTyping();
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !attachmentFile) || !currentUser || !selectedConversation) return;

    let finalAttachment: Attachment | null = null;

    if (attachmentFile) {
      setIsUploading(true);
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${currentUser.id}/${selectedConversation.id}/${fileName}`;

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
      setIsUploading(false);
    }

    sendMessage(text, finalAttachment);
    setText("");
    setAttachmentFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  if (!selectedConversation) return null;

  const isSending = isUploading || isSendingMessage;

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
            <label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="h-5 w-5" />
              <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
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