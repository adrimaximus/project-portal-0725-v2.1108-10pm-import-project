import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation, Message } from "@/types";
import { getInitials } from "@/lib/utils";
import MessageAttachment from "./MessageAttachment";
import CommentRenderer from "./CommentRenderer";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  conversations: Conversation[];
  onForward: (destinationConversationId: string) => void;
}

const ForwardMessageDialog = ({
  open,
  onOpenChange,
  message,
  conversations,
  onForward,
}: ForwardMessageDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(c => c.userName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [conversations, searchTerm]);

  const handleForward = () => {
    if (selectedConversationId) {
      onForward(selectedConversationId);
      onOpenChange(false);
      setSelectedConversationId(null);
      setSearchTerm("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {message && (
            <div className="p-3 border rounded-md bg-muted/50 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">
                Forwarding message from <span className="font-semibold">{message.sender?.name || 'Unknown'}</span>
              </p>
              {message.text && <CommentRenderer text={message.text} members={[]} />}
              {message.attachment && <MessageAttachment attachment={message.attachment} />}
            </div>
          )}
          <Command>
            <CommandInput
              placeholder="Search for a person or group..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <ScrollArea className="h-48">
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {filteredConversations.map(convo => (
                    <CommandItem
                      key={convo.id}
                      value={convo.userName}
                      onSelect={() => setSelectedConversationId(convo.id)}
                      className={`cursor-pointer ${selectedConversationId === convo.id ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={convo.userAvatar} />
                          <AvatarFallback>{getInitials(convo.userName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{convo.userName}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>
          </Command>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleForward} disabled={!selectedConversationId}>
            Forward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;