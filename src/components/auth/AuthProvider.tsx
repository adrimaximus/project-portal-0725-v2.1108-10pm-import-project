import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, Collaborator } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuthErrorBoundary from './AuthErrorBoundary';
import SessionManager from './SessionManager';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
  onlineCollaborators: Collaborator[];
  isImpersonating: boolean;
  startImpersonation: (targetUser: User) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface UserProfileData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  sidebar_order: string[];
  updated_at: string;
  permissions: string[];
  people_kanban_settings: any;
}

export const EnhancedAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalSession, setOriginalSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_user_profile_with_permissions', { p_user_id: supabaseUser.id })
        .single<UserProfileData>();

      if (error || !data) {
        console.error("Error fetching user profile with permissions:", error);
        setError(`Failed to load user profile: ${error?.message || 'Unknown error'}`);
        return null;
      }
      
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      localStorage.setItem('lastUserName', fullName || data.email);

      setError(null); // Clear any previous errors

      return {
        id: data.id,
        name: fullName || data.email,
        email: data.email,
        avatar_url: getAvatarUrl(data.avatar_url, data.id),
        initials: getInitials(fullName, data.email),
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        status: data.status,
        sidebar_order: data.sidebar_order,
        updated_at: data.updated_at,
        permissions: data.permissions || [],
        people_kanban_settings: data.people_kanban_settings,
      };
    } catch (error: any) {
      console.error("Unexpected error fetching user profile:", error);
      setError(`Unexpected error: ${error.message}`);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user);
        setUser(profile);
      }
    } catch (error: any) {
      console.error("Error refreshing user:", error);
      setError(`Failed to refresh user: ${error.message}`);
    }
  }, [fetchUserProfile]);

  const retryAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      const profile = await fetchUserProfile(currentSession?.user ?? null);
      setUser(profile);
    } catch (error: any) {
      console.error("Retry auth error:", error);
      setError(`Retry failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        const profile = await fetchUserProfile(initialSession?.user ?? null);
        setUser(profile);
      } catch (error: any) {
        console.error("Error getting initial session:", error);
        setError(`Failed to initialize: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', event, !!newSession);
      
      try {
        setSession(newSession);
        const profile = await fetchUserProfile(newSession?.user ?? null);
        setUser(profile);
        
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setLoading(false);
        }
        if (event === 'SIGNED_OUT') {
          setIsImpersonating(false);
          setOriginalSession(null);
          setLoading(false);
          setError(null);
        }
      } catch (error: any) {
        console.error("Error handling auth state change:", error);
        setError(`Auth state error: ${error.message}`);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // Online collaborators tracking
  useEffect(() => {
    if (!user) {
      setOnlineCollaborators([]);
      return;
    }

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, async () => {
        const presenceState = channel.presenceState<any>();
        const userIds = Object.keys(presenceState).filter(id => id !== user.id);
        
        if (userIds.length > 0) {
          try {
            const { data } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, email').in('id', userIds);
            if (data) {
              const collaborators = data.map(p => {
                const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                return {
                  id: p.id,
                  name: name || p.email,
                  avatar_url: getAvatarUrl(p.avatar_url, p.id),
                  initials: getInitials(name, p.email),
                  email: p.email,
                  online: true,
                };
              });
              setOnlineCollaborators(collaborators);
            }
          } catch (error: any) {
            console.error('Error fetching online collaborators:', error);
          }
        } else {
          setOnlineCollaborators([]);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setError(null);
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout properly');
    }
  };

  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) return false;
    if (user.role === 'master admin') return true;
    return user.permissions.includes(permission);
  };

  const startImpersonation = async (targetUser: User) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        toast.error("Cannot impersonate without an active session.");
        return;
      }
      setOriginalSession(currentSession);

      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { target_user_id: targetUser.id },
      });

      if (error) {
        toast.error("Impersonation failed", { description: error.message });
      } else {
        const { error: sessionError } = await supabase.auth.setSession(data);
        if (sessionError) {
          toast.error("Failed to set impersonation session", { description: sessionError.message });
        } else {
          setIsImpersonating(true);
          toast.success(`Now viewing as ${targetUser.name}`);
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Impersonation error:', error);
      toast.error('Impersonation failed', { description: error.message });
    }
  };

  const stopImpersonation = async () => {
    try {
      if (!originalSession) {
        toast.error("No original session found to return to.");
        await logout();
        return;
      }
      const { error } = await supabase.auth.setSession(originalSession);
      if (error) {
        toast.error("Failed to stop impersonation", { description: error.message });
      } else {
        setIsImpersonating(false);
        setOriginalSession(null);
        toast.info("Returned to your original session.");
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Stop impersonation error:', error);
      toast.error('Failed to stop impersonation', { description: error.message });
    }
  };

  const value = {
    session,
    user,
    loading,
    error,
    logout,
    hasPermission,
    refreshUser,
    onlineCollaborators,
    isImpersonating,
    startImpersonation,
    stopImpersonation,
    retryAuth,
  };

  return (
    <AuthErrorBoundary>
      <AuthContext.Provider value={value}>
        <SessionManager onSessionExpired={() => navigate('/login', { replace: true })}>
          {children}
        </SessionManager>
      </AuthContext.Provider>
    </AuthErrorBoundary>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};