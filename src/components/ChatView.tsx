import { useState, useRef, useEffect } from 'react';
import { Conversation, Message } from "@/data/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, Users, Smile, Paperclip } from "lucide-react";
import ChatMessage from "./ChatMessage";

interface ChatViewProps {
  conversation: Conversation | null;
  onSendMessage: (conversationId: string, messageText: string) => void;
}

const ChatView = ({ conversation, onSendMessage }: ChatViewProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && conversation) {
      onSendMessage(conversation.id, newMessage.trim());
      setNewMessage("");
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-muted/20">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Selamat Datang di Obrolan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih percakapan dari daftar untuk memulai.
          </p>
        </div>
      </div>
    );
  }

  const isAiAgent = conversation.id === 'ai-agent';

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <Avatar className="h-10 w-10 border">
          {isAiAgent ? (
            <AvatarFallback className="bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </AvatarFallback>
          ) : conversation.isGroup ? (
            <AvatarFallback>
              <Users className="h-5 w-5" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={conversation.userAvatar} alt={conversation.userName} />
              <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
            </>
          )}
        </Avatar>
        <div>
          <p className="font-semibold">{conversation.userName}</p>
          <p className="text-sm text-muted-foreground">
            {isAiAgent ? 'Online' : conversation.isGroup ? `${conversation.members?.length} anggota` : 'Online'}
          </p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {conversation.messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            placeholder="Ketik pesan..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="pr-32"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button type="submit" variant="ghost" size="icon">
              <Send className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default ChatView;