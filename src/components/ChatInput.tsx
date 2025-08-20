import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Paperclip, Send, X, Loader2, Reply } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Attachment, Message } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import MentionsInput, { MentionUser } from "@/components/MentionsInput";
import { MentionMeta, serializeMentions } from "@/lib/mention-utils";

interface ChatInputProps {
  conversationId: string;
  onSendMessage: (text: string, attachment: Attachment | null, replyToId: string | null) => void;
  onTyping?: () => void;
  users?: MentionUser[];
  replyingTo: Message | null;
  onCancelReply: () => void;
}

const ChatInput = ({ conversationId, onSendMessage, onTyping, users = [], replyingTo, onCancelReply }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<MentionMeta[]>([]);
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
    const serializedText = serializeMentions(text, mentions);
    if ((!serializedText.trim() && !attachmentFile) || !currentUser) return;

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
        type: attachmentFile.type,
        url: urlData.publicUrl,
      };
    }

    onSendMessage(serializedText, finalAttachment, replyingTo?.id || null);
    setText("");
    setMentions([]);
    setAttachmentFile(null);
    setIsUploading(false);
    onCancelReply();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  return (
    <div className="border-t p-4 flex-shrink-0">
      {replyingTo && (
        <div className="p-2 mb-2 rounded-md bg-muted/50 flex items-start justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply className="h-4 w-4 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold">Replying to {replyingTo.sender?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{replyingTo.text || "Attachment"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="relative">
        <MentionsInput
          value={text}
          onChange={(v) => { setText(v); triggerTyping(); }}
          mentions={mentions}
          onMentionsChange={setMentions}
          users={users}
          placeholder="Type a message..."
          onEnter={handleSend}
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
        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-400 bg-neutral-900/50 p-2 rounded-md">
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