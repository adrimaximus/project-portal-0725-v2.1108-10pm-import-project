import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Phone, Video, MoreVertical, Users, Settings, LogOut } from "lucide-react";
import { cn, generatePastelColor, getInitials, getAvatarUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import GroupSettingsDialog from "./GroupSettingsDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Conversation } from "@/types";

const ChatHeader = () => {
  const { selectedConversation } = useChat();
  const { user: currentUser } = useAuth();
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  if (!selectedConversation) {
    return (
      <div className="flex items-center p-4 border-b h-[69px]">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }

  const { id, name, avatar, is_group, participants, created_by } = selectedConversation;
  const otherUser = !is_group ? participants?.find(m => m.id !== currentUser?.id) : null;
  const avatarSeed = otherUser?.id || id;
  const finalAvatarUrl = getAvatarUrl(avatar, avatarSeed, is_group);

  const handleLeaveGroup = () => {
    // Implement leave group logic
    console.log("Leaving group...");
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={finalAvatarUrl} />
          <AvatarFallback style={generatePastelColor(avatarSeed)}>{getInitials(name || '')}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{name}</p>
          {is_group ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                    <Users className="h-3 w-3" /> {participants.length} members
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{participants.map(p => p.name).join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <p className="text-xs text-muted-foreground">Online</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon"><Phone className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {is_group && (
              <>
                <DropdownMenuItem onClick={() => setIsGroupSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Group Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLeaveGroup} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {is_group && <GroupSettingsDialog open={isGroupSettingsOpen} onOpenChange={setIsGroupSettingsOpen} conversation={selectedConversation} />}
    </div>
  );
};

export default ChatHeader;