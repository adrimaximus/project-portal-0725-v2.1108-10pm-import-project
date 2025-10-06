import { useContext } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials, formatTimestamp, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Bot, Loader2, MoreVertical, Trash2, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import NewConversationDialog from './NewConversationDialog';

const ChatList = () => {
  const {
    filteredConversations,
    selectedConversation,
    selectConversation,
    loading,
    searchTerm,
    setSearchTerm,
    deleteConversation,
  } = useChat();
  const { user: currentUser } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <NewConversationDialog />
        </div>
        <Input
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* AI Assistant */}
        <div
          className={cn(
            "flex items-center gap-3 p-3 hover:bg-muted border-l-4 border-transparent transition-colors group cursor-pointer",
            selectedConversation?.id === 'ai-assistant' && "bg-muted border-l-primary"
          )}
          onClick={() => selectConversation('ai-assistant')}
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">AI Assistant</p>
            <p className="text-sm text-muted-foreground truncate">Ask me anything...</p>
          </div>
        </div>

        {/* User Conversations */}
        {filteredConversations.map((c) => {
          const otherUser = !c.isGroup ? c.members?.find(m => m.id !== currentUser?.id) : null;
          const avatarSeed = otherUser?.id || c.id;
          const finalAvatarUrl = getAvatarUrl(c.userAvatar, avatarSeed, c.isGroup);

          return (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-3 p-3 hover:bg-muted border-l-4 border-transparent transition-colors group",
                selectedConversation?.id === c.id && "bg-muted border-l-primary"
              )}
            >
              <div
                className="flex-1 flex items-center gap-3 overflow-hidden cursor-pointer"
                onClick={() => selectConversation(c.id)}
              >
                <Avatar>
                  <AvatarImage src={finalAvatarUrl} />
                  <AvatarFallback style={generatePastelColor(otherUser?.id || c.id)}>{getInitials(c.userName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{c.userName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {c.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(c.lastMessageTimestamp)}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this conversation.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteConversation(c.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;