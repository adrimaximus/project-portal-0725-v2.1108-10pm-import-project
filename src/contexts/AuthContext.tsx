import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, Collaborator } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
  onlineCollaborators: Collaborator[];
  isImpersonating: boolean;
  startImpersonation: (targetUser: User) => Promise<void>;
  stopImpersonation: () => Promise<void>;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalSession, setOriginalSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;

    const { data, error } = await supabase
      .rpc('get_user_profile_with_permissions', { p_user_id: supabaseUser.id })
      .single<UserProfileData>();

    if (error || !data) {
      console.error("Error fetching user profile with permissions:", error);
      return null;
    }
    
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    localStorage.setItem('lastUserName', fullName || data.email);

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
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const profile = await fetchUserProfile(currentSession.user);
      setUser(profile);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (_event === 'SIGNED_IN' && newSession) {
        await supabase.auth.setSession(newSession);
      }
      
      setSession(newSession);
      const profile = await fetchUserProfile(newSession?.user ?? null);
      setUser(profile);
      
      if (_event === 'SIGNED_OUT') {
        setIsImpersonating(false);
        setOriginalSession(null);
      }
      
      setLoading(false);
    });

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!session) { // Only set initial state if not already handled by onAuthStateChange
        setSession(currentSession);
        if (currentSession) {
          const profile = await fetchUserProfile(currentSession.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

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
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState<any>();
        const userIds = Object.keys(presenceState).filter(id => id !== user.id);
        
        if (userIds.length > 0) {
          supabase.from('profiles').select('id, first_name, last_name, avatar_url, email').in('id', userIds)
            .then(({ data }) => {
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
            });
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate('/login', { replace: true });
  };

  const hasPermission = (permission: string) => {
    if (!user || !user.permissions) return false;
    if (user.role === 'master admin') return true;
    return user.permissions.includes(permission);
  };

  const startImpersonation = async (targetUser: User) => {
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
  };

  const stopImpersonation = async () => {
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
  };

  const value = {
    session,
    user,
    loading,
    logout,
    hasPermission,
    refreshUser,
    onlineCollaborators,
    isImpersonating,
    startImpersonation,
    stopImpersonation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};