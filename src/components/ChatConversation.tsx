import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, X } from "lucide-react";
import { Conversation, Message } from "@/data/chat";
import { cn } from "@/lib/utils";

interface ChatConversationProps {
  conversation: Conversation | null;
}

const ChatConversation = ({ conversation }: ChatConversationProps) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachment(event.target.files[0]);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleSendMessage = () => {
    if (message.trim() === "" && !attachment) return;

    // Di aplikasi nyata, Anda akan mengirim pesan dan lampiran ke server di sini.
    console.log("Mengirim pesan:", {
      text: message,
      fileName: attachment?.name,
      fileSize: attachment?.size,
    });

    // Reset state setelah "mengirim"
    setMessage("");
    setAttachment(null);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Pilih percakapan untuk mulai mengobrol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.userAvatar} alt={conversation.userName} />
            <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{conversation.userName}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {conversation.messages.map((message: Message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-3",
              message.sender === 'me' ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === 'other' && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={conversation.userAvatar} alt={conversation.userName} />
                <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg",
                message.sender === 'me'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        {attachment && (
          <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted/50 p-2 text-sm">
            <span className="text-muted-foreground truncate pr-2">
              {attachment.name}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Hapus lampiran</span>
            </Button>
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Ketik pesan..."
            className="pr-24"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="ghost" size="icon" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Tambah lampiran</span>
              </label>
            </Button>
            <Button size="icon" onClick={handleSendMessage}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Kirim pesan</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;