import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MoreVertical, Trash2, UserX, Users, Settings, Bot } from "lucide-react";
import StackedAvatar from "./StackedAvatar";
import { getInitials, generatePastelColor } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GroupSettingsDialog from "./GroupSettingsDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Conversation, Collaborator } from "@/types";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  typing?: boolean;
  onLeaveGroup?: (conversationId: string) => void;
  onClearChat?: (conversationId: string) => void;
  onRefetchConversations?: () => void;
}

const ChatHeader = ({ conversation, onBack, typing = false, onLeaveGroup, onClearChat, onRefetchConversations }: ChatHeaderProps) => {
  const { user: currentUser, onlineCollaborators } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center p-4 border-b h-[81px] flex-shrink-0">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }

  const { id, userName, userAvatar, isGroup, members, created_by } = conversation;
  const otherUser = !isGroup ? members?.find(m => m.id !== currentUser?.id) : null;
  const isOwner = currentUser?.id === created_by;
  // Explicitly cast to Collaborator to ensure TS knows about isIdle
  const otherUserCollaborator = otherUser ? onlineCollaborators.find(c => c.id === otherUser.id) as Collaborator | undefined : null;
  const isAiAssistant = userName === "AI Assistant";

  const handleViewProfile = () => {
    if (otherUser) {
      navigate(`/users/${otherUser.id}`);
    }
  };

  const LeaveGroupMenuItem = () => (
    <AlertDialogTrigger asChild>
      <DropdownMenuItem className="text-red-500 focus:text-red-500" onSelect={(e) => e.preventDefault()} disabled={isOwner}>
        <UserX className="mr-2 h-4 w-4" />
        <span>Leave Group</span>
      </DropdownMenuItem>
    </AlertDialogTrigger>
  );

  return (
    <>
      <div className="flex items-center p-4 border-b bg-background/60 backdrop-blur flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        {isGroup && members && members.length > 0 ? (
          <StackedAvatar members={members} />
        ) : isAiAssistant ? (
          <Avatar className="h-10 w-10 border flex items-center justify-center bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </Avatar>
        ) : (
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback style={generatePastelColor(otherUser?.id || id)}>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        )}
        <div className="ml-4 flex-1">
          <p className="text-lg font-semibold">{userName}</p>
          {isGroup ? (
            <p className="text-sm text-muted-foreground">{members?.length} members</p>
          ) : isAiAssistant ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              <span>Ready to help</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              {typing ? (
                "Typing..."
              ) : otherUserCollaborator ? (
                otherUserCollaborator.isIdle ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                    <span>Idle</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Online</span>
                  </>
                )
              ) : (
                "Offline"
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isGroup ? (
                  <>
                    <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Group Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isOwner ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div><LeaveGroupMenuItem /></div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Owners cannot leave a group.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <LeaveGroupMenuItem />
                    )}
                  </>
                ) : isAiAssistant ? (
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Clear Chat</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleViewProfile}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-500 focus:text-red-500" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Clear Chat</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isGroup
                    ? "You will be removed from this group and will no longer receive messages. Are you sure?"
                    : "This will permanently delete all messages in this conversation. This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => isGroup ? onLeaveGroup?.(id) : onClearChat?.(id)}>
                  {isGroup ? "Leave" : "Continue"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {isGroup && (
        <GroupSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          conversation={conversation}
          onUpdate={() => {
            onRefetchConversations?.();
            setIsSettingsOpen(false);
          }}
        />
      )}
    </>
  );
};

export default ChatHeader;