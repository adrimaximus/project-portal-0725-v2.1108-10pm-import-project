import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// This is the full profile data we get from the RPC call
type UserProfileData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string;
  role: string;
  permissions: string[];
  people_kanban_settings: any;
  notification_preferences: any;
};

// This is the user object we'll use throughout the app, with derived properties
export type UserProfile = UserProfileData & {
  name: string;
  initials: string;
};

type AuthContextType = {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  onlineCollaborators: any[];
  isImpersonating: boolean;
  startImpersonation: (user: { id: string }) => void;
  stopImpersonation: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return `${firstName[0]}`.toUpperCase();
  if (email) return `${email.substring(0, 2)}`.toUpperCase();
  return '??';
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCollaborators, setOnlineCollaborators] = useState<any[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  const fetchUserProfile = useCallback(async (session: Session | null) => {
    if (session?.user) {
      try {
        // Backfill navigation items for existing users who might be missing them
        await supabase.rpc('ensure_user_navigation_items', { p_user_id: session.user.id });

        const { data, error } = await supabase
          .rpc('get_user_profile_with_permissions', { p_user_id: session.user.id });

        if (error) throw error;
        
        if (data && data.length > 0) {
          const profileData = data[0] as UserProfileData;
          const name = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email;
          const initials = getInitials(profileData.first_name, profileData.last_name, profileData.email);
          setUser({ ...profileData, name, initials });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isImpersonating) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setSession(session);
      await fetchUserProfile(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, isImpersonating]);

  useEffect(() => {
    // This listener reacts to any change in the roles table.
    const channel = supabase
      .channel('public:roles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'roles' },
        (payload) => {
          const updatedRole = payload.new as { name: string };
          // If the updated role is the one the current user has, refresh their profile.
          if (user && updatedRole.name === user.role) {
            console.log(`User's role '${user.role}' was updated. Refreshing profile and permissions.`);
            toast.info("Your permissions have been updated and will now be reflected.");
            if (session) {
              fetchUserProfile(session);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, session, fetchUserProfile]);

  useEffect(() => {
    if (!user?.id) {
      setOnlineCollaborators([]);
      return;
    }
    const userId = user.id;

    const room = supabase.channel('online-collaborators');

    room
      .on('presence', { event: 'sync' }, () => {
        const presenceState = room.presenceState();
        const collaboratorsMap = new Map<string, any>();

        for (const key in presenceState) {
          const presences = presenceState[key] as unknown as { user: any }[];
          if (presences.length > 0) {
            const user = presences[0].user;
            if (user && user.id !== userId && !collaboratorsMap.has(user.id)) {
              collaboratorsMap.set(user.id, user);
            }
          }
        }
        
        const uniqueCollaborators = Array.from(collaboratorsMap.values());
        setOnlineCollaborators(uniqueCollaborators);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (userRef.current) {
            await room.track({
              user: {
                id: userRef.current.id,
                name: userRef.current.name,
                avatar_url: userRef.current.avatar_url,
                initials: userRef.current.initials,
              },
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [user?.id]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshUser = useCallback(async () => {
    if (session) {
      await fetchUserProfile(session);
    }
  }, [session, fetchUserProfile]);

  const startImpersonation = (targetUser: { id: string }) => {
    toast.warning("Impersonation is a developer feature and not fully implemented.");
    console.log(`Attempting to impersonate user ${targetUser.id}`);
  };

  const stopImpersonation = () => {
    console.log("Stopping impersonation");
  };

  const value = { 
    session, 
    user, 
    loading, 
    hasPermission,
    logout,
    refreshUser,
    onlineCollaborators,
    isImpersonating,
    startImpersonation,
    stopImpersonation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};