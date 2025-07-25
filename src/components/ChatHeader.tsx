import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/data/chat";
import { MoreVertical } from "lucide-react";
import StackedAvatar from "./StackedAvatar";

interface ChatHeaderProps {
  selectedConversation: Conversation | null;
}

const ChatHeader = ({ selectedConversation }: ChatHeaderProps) => {
  if (!selectedConversation) {
    return (
      <div className="flex items-center justify-center p-4 border-b h-[81px]">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }

  const { userName, userAvatar, isGroup, members } = selectedConversation;

  return (
    <div className="flex items-center p-4 border-b">
      {isGroup && members && members.length > 0 ? (
        <StackedAvatar members={members} />
      ) : (
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className="ml-4 flex-1">
        <p className="text-lg font-semibold">{userName}</p>
        {isGroup ? (
          <p className="text-sm text-muted-foreground">{members?.length} members</p>
        ) : (
          <p className="text-sm text-muted-foreground">Online</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;