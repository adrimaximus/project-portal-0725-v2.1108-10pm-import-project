import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collaborator } from "../types";
import { Send, X } from "lucide-react";

type ChatPanelProps = {
  collaborator: Collaborator;
  onClose: () => void;
};

const ChatPanel = ({ collaborator, onClose }: ChatPanelProps) => {
  return (
    <div className="hidden md:flex flex-col h-screen border-l bg-muted/40">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={collaborator.src} alt={collaborator.name} />
            <AvatarFallback>{collaborator.fallback}</AvatarFallback>
          </Avatar>
          <div className="font-semibold">{collaborator.name}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close chat</span>
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-sm text-muted-foreground text-center">
          This is the beginning of your conversation with {collaborator.name}.
        </p>
        {/* Pesan obrolan akan ditampilkan di sini */}
      </div>
      <div className="p-4 border-t bg-background">
        <div className="relative">
          <Input placeholder="Type a message..." className="pr-12" />
          <Button size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;