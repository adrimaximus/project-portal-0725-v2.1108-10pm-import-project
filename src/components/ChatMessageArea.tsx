import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collaborator } from "../types";
import { Send } from "lucide-react";

type ChatMessageAreaProps = {
  conversation: Collaborator | null;
};

const ChatMessageArea = ({ conversation }: ChatMessageAreaProps) => {
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center p-4">
          <p className="text-lg font-semibold">Select a conversation</p>
          <p className="text-muted-foreground">Choose a chat from the list to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-9 w-9">
          <AvatarImage src={conversation.src} alt={conversation.name} />
          <AvatarFallback>{conversation.fallback}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{conversation.name}</h2>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mock messages */}
        <div className="flex items-end gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={conversation.src} alt={conversation.name} />
            <AvatarFallback>{conversation.fallback}</AvatarFallback>
          </Avatar>
          <div className="p-3 rounded-lg bg-muted max-w-xs lg:max-w-md">
            <p className="text-sm">Hey, how's it going?</p>
          </div>
        </div>
        <div className="flex items-end gap-3 justify-end">
          <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-xs lg:max-w-md">
            <p className="text-sm">Pretty good! Just working on the new design. You?</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="p-4 border-t">
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

export default ChatMessageArea;