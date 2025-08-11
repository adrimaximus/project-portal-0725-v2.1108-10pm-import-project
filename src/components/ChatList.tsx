import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageSquarePlus } from "lucide-react";
import { Conversation } from "@/types";
import NewMessageDialog from "./NewMessageDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ChatList = ({
  selectedConversationId,
  onSelectConversation,
}: ChatListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Don't set loading to true on refetch
      // setIsLoading(true); 
      const { data, error } = await supabase.rpc('get_user_conversations');
      
      if (error) {
        toast.error("Gagal memuat percakapan.");
        console.error("Fetch conversations error:", error);
        setIsLoading(false);
        return;
      }

      const formattedConversations: Conversation[] = data.map((c: any) => ({
        id: c.conversation_id,
        isGroup: c.is_group,
        groupName: c.group_name,
        userName: c.is_group ? c.group_name : c.other_user_name,
        userAvatar: c.is_group ? `https://avatar.vercel.sh/${c.group_name}.png` : c.other_user_avatar,
        lastMessage: c.last_message_content,
        lastMessageTimestamp: c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : '',
        participants: c.participants || [],
      }));
      
      setConversations(formattedConversations);
      setIsLoading(false);
    };

    fetchConversations();

    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, fetchConversations)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleConversationCreated = (conversationId: string) => {
    onSelectConversation(conversationId);
    setIsNewMessageOpen(false);
  };

  const filteredConversations = conversations.filter((c) =>
    (c.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-card text-card-foreground">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNewMessageOpen(true)}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari atau mulai chat baru..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Memuat...</div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted",
                selectedConversationId === c.id && "bg-muted"
              )}
              onClick={() => onSelectConversation(c.id)}
            >
              <Avatar>
                <AvatarImage src={c.userAvatar || undefined} />
                <AvatarFallback>{c.userName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{c.userName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {c.lastMessage || 'Belum ada pesan'}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{c.lastMessageTimestamp}</span>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">Tidak ada percakapan.</div>
        )}
      </div>
      <NewMessageDialog
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default ChatList;