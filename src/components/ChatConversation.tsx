import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, X } from "lucide-react";
import { Conversation, Message } from "@/data/chat";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface ChatConversationProps {
  conversation: Conversation | null;
  onSendMessage: (conversationId: string, text: string) => void;
}

// Pengguna saat ini yang di-hardcode untuk demonstrasi, seperti yang terlihat dalam desain
const currentUser = {
  name: "Alex Ray",
  avatar: "https://i.pravatar.cc/40?u=alexray"
};

const ChatConversation = ({ conversation, onSendMessage }: ChatConversationProps) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachment(event.target.files[0]);
    }
    event.target.value = '';
  };

  const handleSendMessage = () => {
    if (!conversation) return;
    const textToSend = message.trim();
    const hasAttachment = !!attachment;

    if (!textToSend && !hasAttachment) return;

    if (textToSend) {
      onSendMessage(conversation.id, textToSend);
    }

    if (hasAttachment) {
      onSendMessage(conversation.id, `[Lampiran: ${attachment.name}]`);
    }

    setMessage("");
    setAttachment(null);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Pilih percakapan untuk mulai mengobrol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-8">
        {conversation.messages.map((msg: Message) => {
          const isMe = msg.sender === 'me';
          const authorName = isMe ? currentUser.name : conversation.userName;
          const authorAvatar = isMe ? currentUser.avatar : conversation.userAvatar;
          const authorFallback = authorName.charAt(0);

          return (
            <div key={msg.id} className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={authorAvatar} alt={authorName} />
                <AvatarFallback>{authorFallback}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Separator and Input */}
      <div className="p-6 border-t">
        {attachment && (
          <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/50 p-2 text-sm">
            <span className="text-muted-foreground truncate pr-2">
              {attachment.name}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Hapus lampiran</span>
            </Button>
          </div>
        )}
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="relative flex-1">
            <Input
              placeholder="Ketik komentar Anda di sini..."
              className="pr-28 h-12"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="ghost" size="icon" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Tambah lampiran</span>
                </label>
              </Button>
              <Button size="icon" onClick={handleSendMessage} className="bg-foreground hover:bg-foreground/90">
                <Send className="h-5 w-5 text-background" />
                <span className="sr-only">Kirim pesan</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;