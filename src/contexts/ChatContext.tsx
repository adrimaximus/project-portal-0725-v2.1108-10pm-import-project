import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { Conversation, Message, Collaborator, ChatMessageAttachment, User } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchConversations as apiFetchConversations,
  fetchMessages as apiFetchMessages,
  createOrGetConversation as apiCreateOrGetConversation,
  createGroupConversation as apiCreateGroupConversation,
  hideConversation as apiHideConversation,
  leaveGroup as apiLeaveGroup,
  toggleReaction as apiToggleReaction,
} from '@/lib/chatApi';
import { useLocation, useNavigate } from 'react-router-dom';

interface ChatContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  selectedConversationId: string | null;
  selectConversation: (conversationId: string | null) => void;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  sendMessage: (text: string, attachment: File | null, replyToId?: string | null) => void;
  isSendingMessage: boolean;
  deleteConversation: (conversationId: string) => void;
  deleteMessage: (messageId: string) => void;
  startNewChat: (collaborator: Collaborator) => void;
  startNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
  leaveGroup: (conversationId: string) => void;
  refetchConversations: () => void;
  unreadConversationIds: Set<string>;
  isChatPageActive: boolean;
  setIsChatPageActive: (isActive: boolean) => void;
  isSomeoneTyping: boolean;
  sendTyping: () => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  forwardMessage: (payload: { message: Message; targetConversationIds: string[] }) => void;
  isForwarding: boolean;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  openForwardDialog: (message: Message) => void;
  forwardingMessage: Message | null;
  setForwardingMessage: (message: Message | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadConversationIds, setUnreadConversationIds] = useState(new Set<string>());
  const [isChatPageActive, setIsChatPageActive] = useState(false);
  const [typingState, setTypingState] = useState<Record<string, { user: string, timestamp: number }>>({});
  const [isForwarding, setIsForwarding] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const channelRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const newConvos = await apiFetchConversations();
      setConversations(prevConvos => {
        const newConvoMap = new Map(newConvos.map(c => [c.id, c]));
        const mergedConvos = prevConvos.map(oldConvo => {
          const newConvoData = newConvoMap.get(oldConvo.id);
          if (newConvoData) {
            newConvoMap.delete(oldConvo.id);
            return {
              ...oldConvo,
              ...newConvoData,
            };
          }
          return null;
        }).filter(Boolean) as Conversation[];

        const brandNewConvos = Array.from(newConvoMap.values()).map(c => ({...c, messages: []}));
        
        return [...mergedConvos, ...brandNewConvos].sort((a, b) => {
            const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return dateB - dateA;
        });
      });
    } catch (error) {
      toast.error("Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (location.state?.selectedCollaborator) {
      startNewChat(location.state.selectedCollaborator);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  const selectConversation = useCallback(async (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    if (conversationId) {
      setUnreadConversationIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
      
      const convo = conversations.find(c => c.id === conversationId);
      if (convo && convo.messages.length === 0) {
        setIsLoadingMessages(true);
        try {
          const messages = await apiFetchMessages(conversationId);
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages } : c));
        } catch (error) {
          toast.error("Failed to load messages.");
        } finally {
          setIsLoadingMessages(false);
        }
      }
    }
  }, [conversations]);

  const sendMessage = async (text: string, attachment: File | null, replyToId?: string | null) => {
    if (!user || !selectedConversationId) return;
    setIsSendingMessage(true);

    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;

      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachment);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = data.publicUrl;
        attachmentName = attachment.name;
        attachmentType = attachment.type;
      }

      if (editingMessage) {
        const { error } = await supabase
          .from('messages')
          .update({ content: text.trim() })
          .eq('id', editingMessage.id);
        if (error) throw error;
        setEditingMessage(null);
      } else {
        const messageId = uuidv4();
        const { error } = await supabase.from('messages').insert({
          id: messageId,
          conversation_id: selectedConversationId,
          sender_id: user.id,
          content: text.trim(),
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType,
          reply_to_message_id: replyToId,
        });
        if (error) throw error;
      }
      setReplyingTo(null);
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase.rpc('soft_delete_message', { p_message_id: messageId });
    if (error) {
      toast.error(`Failed to delete message: ${error.message}`);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await apiHideConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      toast.success("Conversation hidden.");
    } catch (error: any) {
      toast.error(`Failed to hide conversation: ${error.message}`);
    }
  };

  const startNewChat = async (collaborator: Collaborator) => {
    try {
      const conversationId = await apiCreateOrGetConversation(collaborator.id);
      await fetchConversations();
      selectConversation(conversationId);
    } catch (error: any) {
      toast.error(`Failed to start chat: ${error.message}`);
    }
  };

  const startNewGroupChat = async (collaborators: Collaborator[], groupName: string) => {
    try {
      const memberIds = collaborators.map(c => c.id);
      const conversationId = await apiCreateGroupConversation(groupName, memberIds);
      await fetchConversations();
      selectConversation(conversationId);
    } catch (error: any) {
      toast.error(`Failed to create group chat: ${error.message}`);
    }
  };

  const leaveGroup = async (conversationId: string) => {
    try {
      await apiLeaveGroup(conversationId);
      toast.success("You have left the group.");
      fetchConversations();
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
    } catch (error: any) {
      toast.error(`Failed to leave group: ${error.message}`);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const originalConversations = conversations;

    setConversations(prevConvos =>
      prevConvos.map(convo => {
        const messageExists = convo.messages.some(m => m.id === messageId);
        if (!messageExists) return convo;

        return {
          ...convo,
          messages: convo.messages.map(msg => {
            if (msg.id === messageId) {
              const existingReaction = msg.reactions?.find(r => r.user_id === user.id);
              let newReactions = [...(msg.reactions || [])];

              if (existingReaction) {
                if (existingReaction.emoji === emoji) {
                  newReactions = newReactions.filter(r => r.user_id !== user.id);
                } else {
                  newReactions = newReactions.map(r => (r.user_id === user.id ? { ...r, emoji } : r));
                }
              } else {
                newReactions.push({
                  id: uuidv4(),
                  emoji,
                  user_id: user.id,
                  user_name: user.name || user.email || 'You',
                });
              }
              return { ...msg, reactions: newReactions };
            }
            return msg;
          }),
        };
      })
    );

    try {
      await apiToggleReaction(messageId, emoji, user.id);
    } catch (error: any) {
      toast.error(`Failed to update reaction: ${error.message}`);
      setConversations(originalConversations);
    }
  };

  const forwardMessage = async ({ message, targetConversationIds }: { message: Message; targetConversationIds: string[] }) => {
    if (!user) return;
    setIsForwarding(true);
    try {
      const forwardPromises = targetConversationIds.map(convoId => 
        supabase.from('messages').insert({
          conversation_id: convoId,
          sender_id: user.id,
          content: message.text,
          attachment_url: message.attachment?.url,
          attachment_name: message.attachment?.name,
          attachment_type: message.attachment?.type,
          is_forwarded: true,
        })
      );
      await Promise.all(forwardPromises);
      toast.success(`Message forwarded to ${targetConversationIds.length} chat(s).`);
    } catch (error: any) {
      toast.error(`Failed to forward message: ${error.message}`);
    } finally {
      setIsForwarding(false);
      setForwardingMessage(null);
    }
  };

  const openForwardDialog = (message: Message) => setForwardingMessage(message);

  const sendTyping = () => {
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: user.name },
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase.channel('public:messages');
    messagesChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as any;
        const isSender = newMessage.sender_id === user.id;
        if (!isSender && !isChatPageActive) {
          setUnreadConversationIds(prev => new Set(prev).add(newMessage.conversation_id));
        }
        fetchConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMessage = payload.new as any;
        setConversations(prevConvos =>
          prevConvos.map(convo => {
            if (convo.id === updatedMessage.conversation_id) {
              return {
                ...convo,
                messages: convo.messages.map(msg => {
                  if (msg.id === updatedMessage.id) {
                    return { 
                      ...msg, 
                      text: updatedMessage.content, 
                      is_deleted: updatedMessage.is_deleted 
                    };
                  }
                  return msg;
                }),
              };
            }
            return convo;
          })
        );
      })
      .subscribe();

    const reactionsChannel = supabase.channel('public:message_reactions');
    reactionsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, async (payload) => {
        const reaction = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;
        if (!reaction || !reaction.message_id) return;

        let conversationId: string | null = null;
        
        for (const convo of conversations) {
          if (convo.messages.some(m => m.id === reaction.message_id)) {
            conversationId = convo.id;
            break;
          }
        }
        
        if (conversationId) {
          const messages = await apiFetchMessages(conversationId);
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages } : c));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [user, isChatPageActive, fetchConversations, conversations]);

  useEffect(() => {
    if (selectedConversationId) {
      const channel = supabase.channel(`conversation:${selectedConversationId}`);
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user !== user?.name) {
          setTypingState(prev => ({
            ...prev,
            [selectedConversationId]: { user: payload.user, timestamp: Date.now() },
          }));
        }
      }).subscribe();
      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    }
  }, [selectedConversationId, user?.name]);

  const isSomeoneTyping = useMemo(() => {
    if (!selectedConversationId) return false;
    const typingInfo = typingState[selectedConversationId];
    return typingInfo && (Date.now() - typingInfo.timestamp < 3000);
  }, [typingState, selectedConversationId]);

  const value = {
    conversations: conversations.filter(c => c.userName.toLowerCase().includes(searchTerm.toLowerCase())),
    selectedConversation,
    selectedConversationId,
    selectConversation,
    isLoadingConversations,
    isLoadingMessages,
    sendMessage,
    isSendingMessage,
    deleteConversation,
    deleteMessage,
    startNewChat,
    startNewGroupChat,
    leaveGroup,
    refetchConversations: fetchConversations,
    unreadConversationIds,
    isChatPageActive,
    setIsChatPageActive,
    isSomeoneTyping,
    sendTyping,
    toggleReaction,
    forwardMessage,
    isForwarding,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    openForwardDialog,
    forwardingMessage,
    setForwardingMessage,
    searchTerm,
    setSearchTerm,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};