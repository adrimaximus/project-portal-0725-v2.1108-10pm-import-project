import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { Collaborator, Attachment, Message, Conversation } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RealtimeChannelRef = {
  unsubscribe: () => void;
};

const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();

  const messageChannelRef = useRef<RealtimeChannelRef | null>(null);
  const conversationsChannelRef = useRef<RealtimeChannelRef | null>(null);
  const messagesGlobalChannelRef = useRef<RealtimeChannelRef | null>(null);
  // NEW: simpan instance channel aktif untuk broadcast typing
  const activeConvChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const typingTimerRef = useRef<number | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;

    const { data, error } = await supabase.rpc('get_user_conversations');

    if (error) {
      toast.error("Failed to fetch conversations.");
      console.error(error);
      return;
    }

    const mappedConversations: Conversation[] = data.map((c: any) => ({
      id: c.conversation_id,
      userName: c.is_group ? c.group_name : c.other_user_name,
      userAvatar: c.is_group ? undefined : c.other_user_avatar,
      lastMessage: c.last_message_content || "No messages yet.",
      lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
      unreadCount: 0,
      messages: [],
      isGroup: c.is_group,
      members: (c.participants || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar_url,
        initials: p.initials,
        online: true,
      })),
    }));

    setConversations(mappedConversations);

    // Auto-select first conversation on desktop (initial load)
    if (!isMobile && mappedConversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(mappedConversations[0].id);
    }
  }, [currentUser, isMobile, selectedConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const attachConversationRealtime = useCallback((conversationId: string) => {
    // Bersihkan channel lama
    if (messageChannelRef.current) {
      messageChannelRef.current.unsubscribe();
      messageChannelRef.current = null;
    }
    if (activeConvChannelRef.current) {
      supabase.removeChannel(activeConvChannelRef.current);
      activeConvChannelRef.current = null;
    }
    if (!currentUser) return;

    const ch = supabase.channel(`conversation:${conversationId}`, {
      config: { broadcast: { self: true } },
    });

    // Pesan baru pada percakapan ini saja
    ch.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload: any) => {
        const newMessage = payload.new as any;
        if (newMessage.sender_id === currentUser.id) return;

        setConversations(prevConvos => {
          const idx = prevConvos.findIndex(c => c.id === conversationId);
          if (idx === -1) return prevConvos;

          const convo = prevConvos[idx];
          const sender = convo.members?.find(m => m.id === newMessage.sender_id);
          if (!sender) return prevConvos;

          const updatedConvo: Conversation = {
            ...convo,
            lastMessage: newMessage.content || (newMessage.attachment_name || 'Attachment'),
            lastMessageTimestamp: newMessage.created_at,
            messages: selectedConversationId === conversationId
              ? [
                  ...convo.messages,
                  {
                    id: newMessage.id,
                    text: newMessage.content,
                    timestamp: newMessage.created_at,
                    sender,
                    attachment: newMessage.attachment_url
                      ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type }
                      : undefined,
                  } as Message,
                ]
              : convo.messages,
          };

          const copy = [...prevConvos];
          copy[idx] = updatedConvo;
          // Naikkan ke atas
          const [moved] = copy.splice(idx, 1);
          copy.unshift(moved);
          return copy;
        });
      }
    );

    // Typing indicator (broadcast)
    ch.on('broadcast', { event: 'typing' }, (payload: any) => {
      if (payload?.userId && payload.userId !== currentUser.id) {
        setIsSomeoneTyping(true);
        if (typingTimerRef.current) {
          window.clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
      }
    });

    ch.subscribe();

    // Simpan ref untuk kirim broadcast
    activeConvChannelRef.current = ch;

    messageChannelRef.current = {
      unsubscribe: () => {
        try {
          supabase.removeChannel(ch);
        } finally {
          if (activeConvChannelRef.current === ch) {
            activeConvChannelRef.current = null;
          }
        }
      },
    };
  }, [currentUser, selectedConversationId]);

  // Jaga daftar percakapan tetap segar
  useEffect(() => {
    if (conversationsChannelRef.current) return;

    const ch = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe();

    conversationsChannelRef.current = {
      unsubscribe: () => supabase.removeChannel(ch),
    };

    return () => {
      conversationsChannelRef.current?.unsubscribe();
      conversationsChannelRef.current = null;
    };
  }, [fetchConversations]);

  // Global listener: auto-buka percakapan saat pesan baru masuk jika belum ada yang dipilih
  useEffect(() => {
    if (!currentUser) return;
    if (messagesGlobalChannelRef.current) return;

    const ch = supabase
      .channel('messages-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: any) => {
          const msg = payload.new as any;
          if (!msg || msg.sender_id === currentUser.id) return;

          if (!selectedConversationId) {
            const convId = msg.conversation_id as string;

            const exists = conversations.some(c => c.id === convId);
            if (!exists) {
              await fetchConversations();
            }

            setSelectedConversationId(convId);
            handleConversationSelect(convId);
          }
        }
      )
      .subscribe();

    messagesGlobalChannelRef.current = {
      unsubscribe: () => supabase.removeChannel(ch),
    };

    return () => {
      messagesGlobalChannelRef.current?.unsubscribe();
      messagesGlobalChannelRef.current = null;
    };
  }, [currentUser, selectedConversationId, conversations, fetchConversations]);

  const handleConversationSelect = useCallback(async (id: string) => {
    setSelectedConversationId(id);
    setIsSomeoneTyping(false);

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, first_name, last_name, avatar_url, email)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Failed to fetch messages.");
      return;
    }

    const mappedMessages: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      text: m.content,
      timestamp: m.created_at,
      sender: {
        id: m.sender.id,
        name: `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() || m.sender.email,
        avatar: m.sender.avatar_url,
        initials: `${m.sender.first_name?.[0] || ''}${m.sender.last_name?.[0] || ''}`.toUpperCase(),
        email: m.sender.email,
      },
      attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
    }));

    setConversations(prev =>
      prev.some(c => c.id === id)
        ? prev.map(c => (c.id === id ? { ...c, messages: mappedMessages } : c))
        : [
            {
              id,
              userName: 'Conversation',
              userAvatar: undefined,
              lastMessage: mappedMessages[mappedMessages.length - 1]?.text || 'No messages yet.',
              lastMessageTimestamp: mappedMessages[mappedMessages.length - 1]?.timestamp || new Date().toISOString(),
              unreadCount: 0,
              messages: mappedMessages,
              isGroup: true,
              members: [],
            },
            ...prev,
          ]
    );

    attachConversationRealtime(id);
  }, [attachConversationRealtime]);

  // Deep-link: mulai chat dari halaman lain
  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat && currentUser) {
      const existingConvo = conversations.find(c =>
        !c.isGroup && c.members?.some(m => m.id === collaboratorToChat.id && m.id !== currentUser.id)
      );

      if (existingConvo) {
        handleConversationSelect(existingConvo.id);
      } else {
        (async () => {
          const { data, error } = await supabase.rpc('create_or_get_conversation', {
            p_other_user_id: collaboratorToChat.id,
            p_is_group: false
          });
          if (!error && data) {
            await fetchConversations();
            handleConversationSelect(data as string);
          }
        })();
      }

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentUser, conversations, navigate, handleConversationSelect, fetchConversations]);

  // Cleanup
  useEffect(() => {
    return () => {
      messageChannelRef.current?.unsubscribe();
      conversationsChannelRef.current?.unsubscribe();
      messagesGlobalChannelRef.current?.unsubscribe();
      if (activeConvChannelRef.current) {
        supabase.removeChannel(activeConvChannelRef.current);
        activeConvChannelRef.current = null;
      }
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleSendMessage = async (conversationId: string, messageText: string, attachment: Attachment | null) => {
    if (!conversationId || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachment,
    };

    setConversations(prev =>
      prev.map(convo =>
        convo.id === conversationId
          ? {
              ...convo,
              messages: [...convo.messages, optimistic],
              lastMessage: messageText || (attachment ? attachment.name : 'Attachment'),
              lastMessageTimestamp: optimistic.timestamp,
            }
          : convo
      )
    );

    let attachmentData: any = {};
    if (attachment) {
      attachmentData = {
        attachment_url: attachment.url,
        attachment_name: attachment.name,
        attachment_type: attachment.type,
      };
    }

    const { data: dbMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: messageText,
        ...attachmentData,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
      setConversations(prev =>
        prev.map(convo =>
          convo.id === conversationId
            ? { ...convo, messages: convo.messages.filter(m => m.id !== tempId) }
            : convo
        )
      );
    } else {
      setConversations(prev =>
        prev.map(convo =>
          convo.id === conversationId
            ? {
                ...convo,
                messages: convo.messages.map(m =>
                  m.id === tempId ? { ...m, id: dbMessage.id, timestamp: dbMessage.created_at } : m
                ),
              }
            : convo
        )
      );
    }
  };

  // NEW: kirim typing menggunakan channel aktif
  const sendTyping = useCallback(() => {
    if (!activeConvChannelRef.current || !currentUser) return;
    activeConvChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUser.id },
    });
  }, [currentUser]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  if (isMobile) {
    return (
      <PortalLayout noPadding>
        <div className="h-full">
          {!selectedConversation ? (
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleConversationSelect}
              onStartNewChat={async (collaborator: Collaborator) => {
                if (!currentUser) return;
                const { data, error } = await supabase.rpc('create_or_get_conversation', {
                  p_other_user_id: collaborator.id,
                  p_is_group: false
                });
                if (!error && data) {
                  await fetchConversations();
                  handleConversationSelect(data as string);
                }
              }}
              onStartNewGroupChat={async (members: Collaborator[], groupName: string) => {
                if (!currentUser) return;
                const participantIds = members.map(m => m.id);
                const { data, error } = await supabase.rpc('create_group_conversation', {
                  p_group_name: groupName,
                  p_participant_ids: participantIds
                });
                if (!error && data) {
                  await fetchConversations();
                  handleConversationSelect(data as string);
                }
              }}
            />
          ) : (
            <ChatWindow
              selectedConversation={selectedConversation}
              onSendMessage={(text, attachment) => handleSendMessage(selectedConversation.id, text, attachment)}
              onClearChat={async (conversationId: string) => {
                const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
                if (error) toast.error("Failed to clear chat history.");
                else {
                  toast.success("Chat history has been cleared.");
                  setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, messages: [], lastMessage: "Chat cleared", lastMessageTimestamp: new Date().toISOString() } : c
                  ));
                }
              }}
              onBack={() => setSelectedConversationId(null)}
              typing={isSomeoneTyping}
              onTyping={sendTyping}
            />
          )}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleConversationSelect}
          onStartNewChat={async (collaborator: Collaborator) => {
            if (!currentUser) return;
            const { data, error } = await supabase.rpc('create_or_get_conversation', {
              p_other_user_id: collaborator.id,
              p_is_group: false
            });
            if (!error && data) {
              await fetchConversations();
              handleConversationSelect(data as string);
            }
          }}
          onStartNewGroupChat={async (members: Collaborator[], groupName: string) => {
            if (!currentUser) return;
            const participantIds = members.map(m => m.id);
            const { data, error } = await supabase.rpc('create_group_conversation', {
              p_group_name: groupName,
              p_participant_ids: participantIds
            });
            if (!error && data) {
              await fetchConversations();
              handleConversationSelect(data as string);
            }
          }}
        />
        <ChatWindow
          selectedConversation={selectedConversation}
          onSendMessage={(text, attachment) => selectedConversationId && handleSendMessage(selectedConversationId, text, attachment)}
          onClearChat={async (conversationId: string) => {
            const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
            if (error) toast.error("Failed to clear chat history.");
            else {
              toast.success("Chat history has been cleared.");
              setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, messages: [], lastMessage: "Chat cleared", lastMessageTimestamp: new Date().toISOString() } : c
              ));
            }
          }}
          typing={isSomeoneTyping}
          onTyping={sendTyping}
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;