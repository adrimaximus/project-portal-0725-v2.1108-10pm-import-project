import { MessageSquare } from 'lucide-react';

const ChatPlaceholder = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 h-full">
      <MessageSquare className="h-16 w-16 mb-4 text-primary/50" />
      <h2 className="text-2xl font-semibold">Welcome to Chat</h2>
      <p className="mt-2 max-w-xs">
        Select a conversation from the list on the left to start messaging.
      </p>
    </div>
  );
};

export default ChatPlaceholder;