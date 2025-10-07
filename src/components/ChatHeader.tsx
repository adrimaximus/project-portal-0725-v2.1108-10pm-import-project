import { Conversation } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Phone, Video, MoreVertical, Users, ArrowLeft } from "lucide-react";
import StackedAvatar from "./StackedAvatar";
import { getInitials, generatePastelColor } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
}

const ChatHeader = ({ conversation, onBack }: ChatHeaderProps) => {
  const { user } = useAuth();
  const otherUser = conversation.participants.find(p => p.id === conversation.otherUserId);

  return (
    <div className="flex items-center p-3 border-b">
      <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-3 flex-1">
        <Avatar>
          <AvatarImage src={conversation.userAvatar} />
          <AvatarFallback style={generatePastelColor(otherUser?.id || conversation.id)}>
            {getInitials(conversation.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="font-semibold truncate">{conversation.name}</p>
          {conversation.isGroup && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {conversation.participants.length} members
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;