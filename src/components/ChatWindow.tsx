import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Conversation, Message, Collaborator } from '@/types';

interface ChatWindowProps {
  conversationId: string | null;
}

const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    const fetchConversationData = async () => {
      setLoading(true);
      
      const { data: convData, error: convError } = await supabase.rpc('get_user_conversations');
      if (convError) throw convError;
      const currentConv = convData.find((c: any) => c.conversation_id === conversationId);
      
      if (currentConv) {
        setConversation({
          id: currentConv.conversation_id,
          isGroup: currentConv.is_group,
          groupName: currentConv.group_name,
          userName: currentConv.is_group ? currentConv.group_name : currentConv.other_user_name,
          userAvatar: currentConv.is_group ? `https://avatar.vercel.sh/${currentConv.group_name}.png` : currentConv.other_user_avatar,
          participants: currentConv.participants || [],
        });
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, first_name, last_name, avatar_url, email)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        toast.error('Gagal memuat pesan.');
      } else {
        const formattedMessages: Message[] = messagesData.map((m: any) => ({
            id: m.id,
            content: m.content,
            createdAt: m.created_at,
            sender: {
                id: m.sender.id,
                name: `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() || m.sender.email,
                avatar: m.sender.avatar_url,
                initials: `${m.sender.first_name?.[0] || ''}${m.sender.last_name?.[0] || ''}`.toUpperCase() || 'NN',
            }
        }));
        setMessages(formattedMessages);
      }
      setLoading(false);
    };

    fetchConversationData();

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, 
        async (payload) => {
            const { data: newMessageData } = await supabase
                .from('profiles').select('*').eq('id', payload.new.sender_id).single();
            
            const formattedMessage: Message = {
                id: payload.new.id,
                content: payload.new.content,
                createdAt: payload.new.created_at,
                sender: {
                    id: newMessageData.id,
                    name: `${newMessageData.first_name || ''} ${newMessageData.last_name || ''}`.trim() || newMessageData.email,
                    avatar: newMessageData.avatar_url,
                    initials: `${newMessageData.first_name?.[0] || ''}${newMessageData.last_name?.[0] || ''}`.toUpperCase() || 'NN',
                }
            };
            setMessages(currentMessages => [...currentMessages, formattedMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId) return;

    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
    });

    if (error) {
      toast.error('Gagal mengirim pesan.');
      setNewMessage(content);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/40">
        <div className="text-center">
          <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Pilih percakapan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih dari daftar di sebelah kiri untuk melihat pesan.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center">Memuat percakapan...</div>;
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <header className="flex items-center gap-4 border-b p-4">
        <Avatar>
          <AvatarImage src={conversation?.userAvatar || undefined} />
          <AvatarFallback>{conversation?.userName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{conversation?.userName}</p>
          {conversation?.isGroup && <p className="text-xs text-muted-foreground">{conversation.participants?.length} anggota</p>}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'flex items-end gap-2',
              message.sender.id === user?.id ? 'justify-end' : 'justify-start'
            )}
          >
            {message.sender.id !== user?.id && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender.avatar} />
                <AvatarFallback>{message.sender.initials}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'max-w-xs rounded-lg px-3 py-2 md:max-w-md',
                message.sender.id === user?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="text-sm break-words">{message.content}</p>
              <p className="mt-1 text-right text-xs opacity-70">
                {format(new Date(message.createdAt), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>
      <footer className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;