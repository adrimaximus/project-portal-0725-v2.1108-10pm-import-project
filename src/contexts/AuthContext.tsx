import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, Collaborator } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { logAuthEvent } from '@/lib/authLogger';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Collaborator[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalSession, setOriginalSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const createFallbackUser = useCallback((supabaseUser: SupabaseUser): User => {
    const fullName = `${supabaseUser.user_metadata?.first_name || ''} ${supabaseUser.user_metadata?.last_name || ''}`.trim();
    const role = supabaseUser.email === 'adri@7inked.com' ? 'master admin' : 'member';
    
    return {
      id: supabaseUser.id,
      name: fullName || supabaseUser.email || 'User',
      email: supabaseUser.email || '',
      avatar_url: getAvatarUrl(supabaseUser.user_metadata?.avatar_url, supabaseUser.id),
      initials: getInitials(fullName, supabaseUser.email),
      first_name: supabaseUser.user_metadata?.first_name,
      last_name: supabaseUser.user_metadata?.last_name,
      role: role,
      status: 'active',
      permissions: role === 'master admin' ? ['*'] : ['module:dashboard', 'module:projects'],
    };
  }, []);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;

    console.log('Fetching user profile for:', supabaseUser.email);

    try {
      // Try to get the profile from the database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        console.log("Profile not found, creating new profile...");
        
        // Create fallback user first
        const fallbackUser = createFallbackUser(supabaseUser);
        
        // Try to create the profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            first_name: supabaseUser.user_metadata?.first_name || null,
            last_name: supabaseUser.user_metadata?.last_name || null,
            avatar_url: supabaseUser.user_metadata?.avatar_url || null,
            role: fallbackUser.role,
            status: 'active',
          });

        if (insertError) {
          console.error("Error creating user profile:", insertError);
          console.log("Using fallback user without database profile");
          return fallbackUser;
        }

        console.log("Profile created successfully");
        return fallbackUser;
      }

      if (profileError || !profileData) {
        console.error("Error fetching user profile:", profileError);
        console.log("Using fallback user due to profile fetch error");
        return createFallbackUser(supabaseUser);
      }
      
      const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
      localStorage.setItem('lastUserName', fullName || profileData.email);

      const userProfile: User = {
        id: profileData.id,
        name: fullName || profileData.email,
        email: profileData.email,
        avatar_url: getAvatarUrl(profileData.avatar_url, profileData.id),
        initials: getInitials(fullName, profileData.email),
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        status: profileData.status,
        sidebar_order: profileData.sidebar_order,
        updated_at: profileData.updated_at,
        permissions: profileData.role === 'master admin' ? ['*'] : ['module:dashboard', 'module:projects'],
        people_kanban_settings: profileData.people_kanban_settings,
      };

      console.log('User profile loaded successfully:', userProfile.email, 'Role:', userProfile.role);
      return userProfile;

    } catch (error: any) {
      console.error("Unexpected error in fetchUserProfile:", error);
      console.log("Using fallback user due to unexpected error");
      return createFallbackUser(supabaseUser);
    }
  }, [createFallbackUser]);

  const refreshUser = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const profile = await fetchUserProfile(currentSession.user);
      setUser(profile);
    }
  }, [fetchUserProfile]);

  // Force redirect to dashboard when user is authenticated but on login page
  useEffect(() => {
    if (!loading && session && user && location.pathname === '/login') {
      console.log('User is authenticated but on login page, forcing redirect to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, session, user, location.pathname, navigate]);

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session:', initialSession ? 'Found' : 'Not found');
        setSession(initialSession);
        
        if (initialSession?.user) {
          console.log('Fetching profile for initial session user...');
          const profile = await fetchUserProfile(initialSession.user);
          if (mounted) {
            setUser(profile);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Unexpected error in initializeAuth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', event, newSession ? 'Session exists' : 'No session');
      
      if (!mounted) return;
      
      setSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        console.log('User signed in, fetching profile...');
        const profile = await fetchUserProfile(newSession.user);
        if (mounted) {
          setUser(profile);
          setLoading(false);
          // Only redirect if not already on a protected route
          if (location.pathname === '/login' || location.pathname === '/auth/callback' || location.pathname === '/') {
            console.log('Redirecting to dashboard after sign in');
            navigate('/dashboard', { replace: true });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        if (mounted) {
          setUser(null);
          setIsImpersonating(false);
          setOriginalSession(null);
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
        console.log('Token refreshed, updating profile...');
        const profile = await fetchUserProfile(newSession.user);
        if (mounted) {
          setUser(profile);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, navigate, location.pathname]);

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
    const userEmail = user?.email;
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    
    // Log logout event
    if (userEmail) {
      await logAuthEvent({
        event_type: 'logout',
        email: userEmail,
        success: true,
      });
    }
    
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