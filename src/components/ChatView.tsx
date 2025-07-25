import { Conversation } from "@/data/chat";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Paperclip, Send } from "lucide-react";

interface ChatViewProps {
  conversation: Conversation | undefined;
}

const ChatView = ({ conversation }: ChatViewProps) => {
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Select a conversation</h2>
          <p className="text-muted-foreground">
            Choose from your existing conversations to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={conversation.userAvatar} alt={conversation.userName} />
          <AvatarFallback>{conversation.userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="font-semibold">{conversation.userName}</p>
          {conversation.isGroup && (
            <p className="text-sm text-muted-foreground">
              {conversation.members?.length} members
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Messages would be rendered here */}
        <p className="text-center text-muted-foreground">
          This is the beginning of your conversation with {conversation.userName}.
        </p>
      </div>
      <div className="p-4 border-t bg-background">
        <div className="relative">
          <Input placeholder="Type a message..." className="pr-24" />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;