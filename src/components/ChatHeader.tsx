import { useState } from 'react';
import { Conversation } from '@/types';
import GroupSettingsDialog from './GroupSettingsDialog';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';

// This is a mock component structure based on the error.
// The actual file might be different.

interface ChatHeaderProps {
  conversation: Conversation & { conversation_id: string; conversation_name?: string; participants?: { id: string }[] };
  onRefetchConversations?: () => void;
}

const ChatHeader = ({ conversation, onRefetchConversations }: ChatHeaderProps) => {
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  return (
    <div className="p-4 border-b flex justify-between items-center">
      <h2 className="font-semibold">{conversation.conversation_name}</h2>
      <Button variant="ghost" size="icon" onClick={() => setIsGroupSettingsOpen(true)}>
        <Settings className="h-4 w-4" />
      </Button>
      {isGroupSettingsOpen && (
        <GroupSettingsDialog
          open={isGroupSettingsOpen}
          onOpenChange={setIsGroupSettingsOpen}
          conversation={conversation}
        />
      )}
    </div>
  );
};

export default ChatHeader;