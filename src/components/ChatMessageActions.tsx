import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Message } from "@/types";
import {
  ChevronDown,
  CornerUpLeft,
  Smile,
  Share,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatMessageActionsProps {
  message: Message;
  isCurrentUser: boolean;
  onReply: (message: Message) => void;
  className?: string;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const ChatMessageActions = ({
  message,
  isCurrentUser,
  onReply,
  className,
}: ChatMessageActionsProps) => {
  const { deleteMessage, toggleReaction } = useChatContext();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success("Message copied to clipboard.");
    }
  };

  const handleForward = () => {
    toast.info("Forwarding messages is not yet implemented.");
  };

  const handleEdit = () => {
    toast.info("Editing messages is not yet implemented.");
  };

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity flex-shrink-0", className)}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isCurrentUser ? "end" : "start"} onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => onReply(message)}>
            <CornerUpLeft className="mr-2 h-4 w-4" />
            <span>Reply</span>
          </DropdownMenuItem>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Smile className="mr-2 h-4 w-4" />
              <span>React</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <div className="flex p-1">
                  {QUICK_REACTIONS.map(emoji => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReaction(message.id, emoji);
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={handleForward}>
            <Share className="mr-2 h-4 w-4" />
            <span>Forward</span>
          </DropdownMenuItem>
          {message.text && (
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
            </DropdownMenuItem>
          )}
          {isCurrentUser && !message.is_deleted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Message?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this message for everyone. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteMessage(message.id)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};