"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile extends User {
  notification_preferences?: Record<string, any>;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchUserProfile = useCallback(async (user: User | null): Promise<UserProfile | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return user as UserProfile;
    }
    
    return { ...user, ...data };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchUserProfile(authUser);
      setUser(profile);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const profile = await fetchUserProfile(session?.user ?? null);
      setUser(profile);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const profile = await fetchUserProfile(session?.user ?? null);
      setUser(profile);
      if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
        setIsLoading(false);
      }
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // --- Logika Suara Notifikasi ---
  useEffect(() => {
    if (user?.notification_preferences?.tone && user.notification_preferences.tone !== 'none') {
      const audio = new Audio(`${TONE_BASE_URL}${user.notification_preferences.tone}`);
      audio.preload = 'auto';
      audioRef.current = audio;
    } else {
      audioRef.current = null;
    }
  }, [user?.notification_preferences?.tone]);

  useEffect(() => {
    if (!user?.id) return;

    const handleNewMessage = async (payload: any) => {
      const newMessage = payload.new as { sender_id: string; conversation_id: string };

      const isChatPage = window.location.pathname.startsWith('/chat');
      const isMyMessage = newMessage.sender_id === user.id;
      const chatNotificationsEnabled = user.notification_preferences?.comment !== false;

      if (isMyMessage || isChatPage || !chatNotificationsEnabled || !audioRef.current) {
        return;
      }

      const { count } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', newMessage.conversation_id)
        .eq('user_id', user.id);

      if (count && count > 0) {
        audioRef.current.play().catch(e => console.error("Error playing notification sound:", e));
      }
    };

    const channel = supabase
      .channel('public:messages:sound-handler')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        handleNewMessage
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  // --- Akhir Logika Suara Notifikasi ---

  const value = {
    user,
    session,
    isLoading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};