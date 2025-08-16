import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Conversation } from "@/types";
import { ArrowLeft, MoreVertical, Trash2, UserX, Users } from "lucide-react";
import StackedAvatar from "./StackedAvatar";
import { getInitials } from "@/lib/utils";

interface ChatHeaderProps {
  selectedConversation: Conversation | null;
  onBack?: () => void;
}

const ChatHeader = ({ selectedConversation, onBack }: ChatHeaderProps) => {
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
      {onBack && (
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
      )}
      {isGroup && members && members.length > 0 ? (
        <StackedAvatar members={members} />
      ) : (
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isGroup ? (
              <>
                <DropdownMenuItem onClick={() => console.log("View Members")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>View Members</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => console.log("Leave Group")}>
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Leave Group</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => console.log("View Profile")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => console.log("Clear Chat")}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Clear Chat</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;