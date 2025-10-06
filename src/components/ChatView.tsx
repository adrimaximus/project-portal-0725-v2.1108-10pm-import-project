import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ChatInput from "./ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials, generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Message } from "@/types";

const ChatView = () => {
  const { selectedConversation } = useChatContext();
  const { user: currentUser } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation || selectedConversation.id === 'ai-assistant') return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, first_name, last_name, avatar_url, email)')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation && selectedConversation.id !== 'ai-assistant',
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const handleSendMessage = async (text: string, attachmentFile: File | null, replyToMessageId?: string | null) => {
    if ((!text.trim() && !attachmentFile) || !selectedConversation || !currentUser) return;
    
    setIsSending(true);

    if (attachmentFile) {
      toast.warning("File attachments are not implemented in this chat yet.");
    }

    const newMessage = {
      content: text,
      conversation_id: selectedConversation.id,
      sender_id: currentUser.id,
      reply_to_message_id: replyToMessageId,
    };

    const { error } = await supabase.from('messages').insert(newMessage);

    if (error) {
      toast.error("Failed to send message.");
    } else {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
    setIsSending(false);
  };

  if (!selectedConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/50">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }
  
  if (selectedConversation.id === 'ai-assistant') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/50">
        <p className="text-muted-foreground">AI Assistant chat is not implemented yet.</p>
      </div>
    );
  }

  const otherUser = !selectedConversation.isGroup ? selectedConversation.members?.find(m => m.id !== currentUser?.id) : null;
  const avatarSeed = otherUser?.id || selectedConversation.id;
  const finalAvatarUrl = getAvatarUrl(selectedConversation.userAvatar, avatarSeed, selectedConversation.isGroup);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 border-b">
        <Avatar>
          <AvatarImage src={finalAvatarUrl} />
          <AvatarFallback style={generatePastelColor(avatarSeed)}>
            {getInitials(selectedConversation.userName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{selectedConversation.userName}</p>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {isLoading && <p className="text-center text-muted-foreground">Loading messages...</p>}
          {messages.map((msg: any) => (
            <div key={msg.id} className={cn("flex items-start gap-3", msg.sender_id === currentUser?.id && "justify-end")}>
              {msg.sender_id !== currentUser?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(msg.sender?.avatar_url, msg.sender_id)} />
                  <AvatarFallback style={generatePastelColor(msg.sender_id)}>
                    {getInitials(msg.sender?.first_name || msg.sender?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg break-words", msg.sender_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.created_at), 'HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isSending={isSending} 
        conversationId={selectedConversation.id}
        replyTo={null}
        onCancelReply={() => {}}
      />
    </div>
  );
};

export default ChatView;