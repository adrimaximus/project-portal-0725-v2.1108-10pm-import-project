"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { playNotificationSound } from '@/utils/playSound';
import { User } from '@supabase/supabase-js';

interface UserProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
  permissions: string[] | null;
  notification_preferences: any;
  people_kanban_settings?: any;
}

// This will be the user object type used throughout the app
export interface AppUser extends User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  notification_preferences: any;
  people_kanban_settings?: any;
  role?: string;
  permissions?: string[];
  name: string;
  initials: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isImpersonating: boolean;
  startImpersonation: (userId: string) => void;
  stopImpersonation: () => void;
  onlineCollaborators: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [onlineCollaborators, setOnlineCollaborators] = useState<any[]>([]);

  const fetchUserProfile = async (authUser: User): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .rpc('get_user_profile_with_permissions', { p_user_id: authUser.id })
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load your profile.");
      return null;
    }
    
    const profile = data as UserProfileData;

    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || '';
    const initials = ((profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || name.substring(0, 2)).toUpperCase();

    return { ...authUser, ...profile, name, initials };
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const fullUser = await fetchUserProfile(session.user);
      setUser(fullUser);
    } else {
      setUser(null);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const startImpersonation = (userId: string) => {
    console.log(`Starting impersonation for user ${userId}`);
    setIsImpersonating(true);
  };

  const stopImpersonation = () => {
    console.log("Stopping impersonation");
    setIsImpersonating(false);
  };

  useEffect(() => {
    setIsLoading(true);
    refreshUser().finally(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const fullUser = await fetchUserProfile(session.user);
        setUser(fullUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time notification listener
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.read_at) return;

          const { data: notification, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.notification_id)
            .single();

          if (error || !notification) {
            console.error('Error fetching notification details:', error);
            return;
          }
          
          toast.info(notification.title, {
            description: notification.body,
          });

          const preferences = user.notification_preferences;
          if (preferences && preferences[notification.type]) {
            const setting = preferences[notification.type];
            if (setting.enabled && setting.sound && setting.sound !== 'None') {
              playNotificationSound(setting.sound);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to real-time notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = { 
    user, 
    isLoading, 
    refreshUser, 
    logout, 
    hasPermission,
    isImpersonating,
    startImpersonation,
    stopImpersonation,
    onlineCollaborators
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