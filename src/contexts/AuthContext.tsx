import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Collaborator } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import SafeLocalStorage from '@/lib/localStorage';
import debounce from 'lodash.debounce';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  onlineCollaborators: Collaborator[];
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isImpersonating: boolean;
  startImpersonation: (targetUser: User) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IMPERSONATION_KEY = 'impersonation_active';
const ORIGINAL_SESSION_KEY = 'original_session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const queryClient = useQueryClient();

  const fetchUserProfile = async (userId: string | undefined) => {
    if (!userId) return null;

    const tryFetch = async () => {
        const { data, error } = await supabase
            .rpc('get_user_profile_with_permissions', { p_user_id: userId })
            .single();
        return { data, error };
    };

    let { data, error } = await tryFetch();

    // If no profile found (PGRST116), it might be a new user whose profile is being created.
    // Retry once after a short delay to handle potential race conditions with the new_user trigger.
    if (error && error.code === 'PGRST116') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const retryResult = await tryFetch();
        data = retryResult.data;
        error = retryResult.error;
    }

    if (error) {
      console.error('Error fetching user profile with permissions:', error);
      if (error.code === 'PGRST116') {
        console.warn("User profile not found, this might be a new user. The app will keep trying to fetch it.");
      }
      return null;
    }
    
    const userProfile = data as User;
    if (userProfile.first_name || userProfile.last_name) {
      SafeLocalStorage.setItem('lastUserName', `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim());
    }
    return userProfile;
  };

  const { data: user, isLoading: isUserLoading, refetch: refreshUser } = useQuery({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: () => fetchUserProfile(session?.user?.id),
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const checkImpersonation = () => {
      const impersonating = SafeLocalStorage.getItem(IMPERSONATION_KEY);
      setIsImpersonating(!!impersonating);
    };

    checkImpersonation();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        SafeLocalStorage.removeItem(IMPERSONATION_KEY);
        SafeLocalStorage.removeItem(ORIGINAL_SESSION_KEY);
        setIsImpersonating(false);
      }
      setSession(session);
      checkImpersonation();
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    const newChannel = supabase.channel(`online-users`, {
      config: { presence: { key: user.id } },
    });

    const trackPayload = {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase(),
      avatar_url: user.avatar_url,
    };

    const updateActivity = debounce(async () => {
      const lastActiveTimestamp = new Date().toISOString();
      // Update presence for UI
      await newChannel.track({ ...trackPayload, last_active_at: lastActiveTimestamp });
      // Update profile for backend logic
      if (user) {
        await supabase
          .from('profiles')
          .update({ last_active_at: lastActiveTimestamp })
          .eq('id', user.id);
      }
    }, 30000, { leading: true, trailing: false });

    const calculateOnlineCollaborators = () => {
      const newState = newChannel.presenceState<any>();
      // Consider users idle if inactive for more than 5 minutes
      const fiveMinutesAgo = new Date().getTime() - 5 * 60 * 1000;

      const collaborators: Collaborator[] = Object.values(newState)
        .flat()
        .filter(c => c.id !== user.id)
        .map(c => {
          const lastActive = c.last_active_at ? new Date(c.last_active_at).getTime() : 0;
          const isIdle = lastActive < fiveMinutesAgo;
          return { ...c, isIdle };
        });
      
      const uniqueCollaborators = Array.from(new Map(collaborators.map(c => [c.id, c])).values());
      setOnlineCollaborators(uniqueCollaborators);
    };

    newChannel
      .on('presence', { event: 'sync' }, calculateOnlineCollaborators)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updateActivity();
          window.addEventListener('mousemove', updateActivity);
          window.addEventListener('keydown', updateActivity);
          window.addEventListener('click', updateActivity);
          window.addEventListener('scroll', updateActivity);
        }
      });

    setChannel(newChannel);

    // Interval to send activity updates (heartbeat)
    const activityInterval = setInterval(async () => {
      await updateActivity();
    }, 4 * 60 * 1000);

    // Interval to re-check idle status locally every minute
    const idleCheckInterval = setInterval(calculateOnlineCollaborators, 60000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(activityInterval);
      clearInterval(idleCheckInterval);
      updateActivity.cancel();
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
      setChannel(null);
    };
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    queryClient.clear();
  };

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'master admin' || user.permissions?.includes('*')) {
      return true;
    }
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  const startImpersonation = async (targetUser: User) => {
    if (!session) {
      toast.error("You must be logged in to impersonate.");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { target_user_id: targetUser.id },
      });

      if (error) throw error;

      SafeLocalStorage.setItem(ORIGINAL_SESSION_KEY, session);
      SafeLocalStorage.setItem(IMPERSONATION_KEY, true);

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) throw sessionError;

      setIsImpersonating(true);
      toast.success(`Now viewing as ${targetUser.name}.`);
    } catch (error: any) {
      toast.error("Failed to impersonate user.", { description: error.message });
    }
  };

  const stopImpersonation = async () => {
    const originalSession = SafeLocalStorage.getItem<Session>(ORIGINAL_SESSION_KEY);
    if (!originalSession) {
      toast.error("Original session not found. Please log out and log back in.");
      return;
    }

    const { error } = await supabase.auth.setSession(originalSession);
    if (error) {
      toast.error("Failed to restore original session.", { description: error.message });
      return;
    }

    SafeLocalStorage.removeItem(IMPERSONATION_KEY);
    SafeLocalStorage.removeItem(ORIGINAL_SESSION_KEY);
    setIsImpersonating(false);
    toast.info("Returned to your original session.");
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      session, 
      isLoading: isLoading || isUserLoading, 
      onlineCollaborators,
      logout,
      refreshUser: async () => { await refreshUser() },
      hasPermission,
      isImpersonating,
      startImpersonation,
      stopImpersonation,
    }}>
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