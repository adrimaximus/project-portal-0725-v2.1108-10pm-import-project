import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatContext } from '@/contexts/ChatContext';
import { Message } from '@/types';
import { generatePastelColor } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ForwardMessageDialogProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ForwardMessageDialog = ({ message, isOpen, onClose }: ForwardMessageDialogProps) => {
  const { conversations, forwardMessage, isForwarding } = useChatContext();
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversations(prev =>
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForward = () => {
    if (message && selectedConversations.length > 0) {
      forwardMessage({ message, targetConversationIds: selectedConversations });
    }
  };
  
  const sortedConversations = [...conversations].sort((a, b) => 
    new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Forward message to...</DialogTitle>
          <DialogDescription>Select one or more chats.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full pr-4">
          <div className="space-y-2">
            {sortedConversations.map(convo => (
              <div
                key={convo.id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => handleSelectConversation(convo.id)}
              >
                <Checkbox
                  id={`forward-${convo.id}`}
                  checked={selectedConversations.includes(convo.id)}
                  onCheckedChange={() => handleSelectConversation(convo.id)}
                />
                <Avatar className="h-9 w-9">
                  <AvatarImage src={convo.userAvatar} />
                  <AvatarFallback style={generatePastelColor(convo.id)}>
                    {convo.userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor={`forward-${convo.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                  {convo.userName}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleForward} disabled={selectedConversations.length === 0 || isForwarding}>
            {isForwarding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isForwarding ? 'Sending...' : `Send to ${selectedConversations.length} chat(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};