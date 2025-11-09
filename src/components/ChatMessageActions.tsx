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
  MoreHorizontal,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from "@/contexts/ThemeProvider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

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
  const { deleteMessage, toggleReaction, openForwardDialog } = useChatContext();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedText, setEditedText] = useState(message.text || '');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { theme } = useTheme();

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success("Message copied to clipboard.");
    }
  };

  const handleDownload = () => {
    if (message.attachment) {
      const link = document.createElement('a');
      link.href = message.attachment.url;
      link.download = message.attachment.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started.");
    }
  };

  const handleEdit = () => {
    setEditedText(message.text || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editedText.trim() || editedText.trim() === message.text) {
      setIsEditDialogOpen(false);
      return;
    }
  
    const { error } = await supabase
      .from('messages')
      .update({ content: editedText.trim() })
      .eq('id', message.id);
  
    if (error) {
      toast.error(`Failed to edit message: ${error.message}`);
    } else {
      toast.success("Message updated.");
    }
    setIsEditDialogOpen(false);
  };

  return (
    <>
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
                  <div className="flex p-1 items-center">
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
                    <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto border-none" onClick={(e) => e.stopPropagation()}>
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: any) => {
                            toggleReaction(message.id, emoji.native);
                            setEmojiPickerOpen(false);
                          }}
                          theme={theme === 'dark' ? 'dark' : 'light'}
                          previewPosition="none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={() => openForwardDialog(message)}>
              <Share className="mr-2 h-4 w-4" />
              <span>Forward</span>
            </DropdownMenuItem>
            {message.attachment && (
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
            )}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-message-textarea" className="sr-only">Edit Message</Label>
            <Textarea
              id="edit-message-textarea"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};