import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser, Collaborator } from '@/types';
import { toast } from 'sonner';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileWithPermissions {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  sidebar_order: string[] | null;
  permissions: string[] | null;
  people_kanban_settings: {
    columnOrder?: string[];
    visibleColumnIds?: string[];
    collapseOverrides?: Record<string, boolean>;
  } | null;
}

interface AuthContextType {
  session: SupabaseSession | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  onlineCollaborators: Collaborator[];
  isImpersonating: boolean;
  realUser: User | null;
  startImpersonation: (targetUser: User) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [realUser, setRealUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    setUser(null);
    setSession(null);
    setIsImpersonating(false);
    setRealUser(null);
    localStorage.removeItem('lastUserName');
    localStorage.removeItem('realUserSession');
    queryClient.clear();
    if (error) {
      console.error("Error logging out:", error);
      toast.error("Logout failed. Please try again.");
    }
    navigate('/', { replace: true });
  }, [navigate, queryClient]);

  const stopImpersonation = useCallback(async (showToast = true) => {
    const realSessionString = localStorage.getItem('realUserSession');
    if (!realSessionString) return;

    const realSession = JSON.parse(realSessionString);

    // Update UI state immediately for responsiveness
    localStorage.removeItem('realUserSession');
    setIsImpersonating(false);
    setRealUser(null);

    const { error } = await supabase.auth.setSession(realSession);

    if (error) {
      toast.error("Failed to restore your original session. Logging you out for security.");
      await logout();
    } else {
      if (showToast) {
        toast.info("Returned to your admin account.");
      }
      // The onAuthStateChange listener will handle fetching the new user profile.
      // We still need to invalidate other data, like projects, goals, etc.
      await queryClient.invalidateQueries();
    }
  }, [logout, queryClient]);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser, retries = 3, delay = 500) => {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .rpc('get_user_profile_with_permissions', { p_user_id: supabaseUser.id })
        .single();

      const profile = data as ProfileWithPermissions | null;

      if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        const userToSet: User = {
          id: profile.id,
          email: supabaseUser.email,
          name: fullName || supabaseUser.email || 'No name',
          avatar_url: getAvatarUrl(profile.avatar_url, profile.id),
          initials: getInitials(fullName, supabaseUser.email) || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role || undefined,
          status: profile.status || undefined,
          sidebar_order: profile.sidebar_order || undefined,
          permissions: profile.permissions || [],
          people_kanban_settings: profile.people_kanban_settings || {},
        };
        setUser(userToSet);
        // Check against localStorage because state update might not be immediate
        if (!localStorage.getItem('realUserSession')) {
          localStorage.setItem('lastUserName', userToSet.name);
        }
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        toast.error("There was a problem loading your profile. Please log in again.");
        await logout();
        return;
      }

      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }

    console.warn(`Could not fetch user profile for ${supabaseUser.id} after ${retries} attempts. Logging out.`);
    toast.error("Could not retrieve your user profile. Please try logging in again.");
    await logout();
  }, [logout]);

  const startImpersonation = async (targetUser: User) => {
    if (user?.role !== 'master admin') {
      toast.error("You do not have permission to do this.");
      return;
    }
    toast.info(`Starting session as ${targetUser.name}...`);
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(`Could not get current session: ${sessionError.message}`);
      if (!currentSession) {
        throw new Error("Auth session missing! Please try logging in again.");
      }

      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: { target_user_id: targetUser.id },
      });
      if (error) throw error;

      localStorage.setItem('realUserSession', JSON.stringify(currentSession));
      setRealUser(user);

      const { error: sessionErrorSet } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionErrorSet) throw sessionErrorSet;

      setIsImpersonating(true);
      await queryClient.invalidateQueries();
      navigate('/dashboard', { replace: true });
      toast.success(`You are now viewing as ${targetUser.name}.`);
    } catch (error: any) {
      let description = error.message;
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error) {
            description = errorBody.error;
          }
        } catch (e) {
          // ignore parsing error
        }
      }
      toast.error("Failed to start impersonation.", { description });
    }
  };

  useEffect(() => {
    const realSessionString = localStorage.getItem('realUserSession');
    if (realSessionString) {
      setIsImpersonating(true);
    }

    const getSessionAndListen = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        if (initialSession) {
          await fetchUserProfile(initialSession.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error during initial session fetch:", error);
        await logout();
      } finally {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password');
          return;
        }
        if (event === 'SIGNED_OUT') {
          toast.success("You have been successfully logged out.");
        }
        if (event === 'TOKEN_REFRESHED' && !newSession) {
          console.warn('Token refresh failed, forcing logout.');
          await logout();
          return;
        }

        setSession(newSession);
        if (newSession) {
          await fetchUserProfile(newSession.user);
          // On a fresh sign-in, always redirect to the dashboard.
          // This won't trigger on page refreshes (INITIAL_SESSION) or token refreshes.
          if (event === 'SIGNED_IN') {
            navigate('/dashboard', { replace: true });
          }
        } else {
          setUser(null);
          localStorage.removeItem('lastUserName');
        }
      });

      return subscription;
    };

    const subscriptionPromise = getSessionAndListen();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscriptionPromise.then(subscription => subscription?.unsubscribe());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUserProfile, logout, navigate]);

  useEffect(() => {
    if (!user) {
      setOnlineCollaborators([]);
      return;
    };

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    const handlePresenceChange = () => {
      const newState = channel.presenceState<any>();
      const collaborators: Collaborator[] = [];
      for (const id in newState) {
        if (id !== user.id) {
          const presences = newState[id];
          if (presences && presences.length > 0 && presences[0].user) {
            const collaboratorUser = presences[0].user;
            collaborators.push({ 
              ...collaboratorUser, 
              avatar_url: getAvatarUrl(collaboratorUser.avatar_url, collaboratorUser.id), 
              online: true 
            });
          }
        }
      }
      setOnlineCollaborators(collaborators.sort((a, b) => a.name.localeCompare(b.name)));
    };

    channel
      .on('presence', { event: 'sync' }, handlePresenceChange)
      .on('presence', { event: 'join' }, handlePresenceChange)
      .on('presence', { event: 'leave' }, handlePresenceChange);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user: {
            id: user.id,
            name: user.name,
            initials: user.initials,
            avatar_url: user.avatar_url,
          },
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchUserProfile(session.user);
    }
  }, [fetchUserProfile]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'master admin') return true;
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  const value = {
    session,
    user,
    loading,
    logout,
    refreshUser,
    hasPermission,
    onlineCollaborators,
    isImpersonating,
    realUser,
    startImpersonation,
    stopImpersonation,
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