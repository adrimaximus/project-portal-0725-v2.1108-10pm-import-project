import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';

interface AuthContextType {
  session: SupabaseSession | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (supabaseUser: SupabaseUser, retries = 3, delay = 500) => {
    for (let i = 0; i < retries; i++) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', profile.role)
          .single();

        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        const userToSet: User = {
          id: profile.id,
          email: supabaseUser.email,
          name: fullName || supabaseUser.email || 'No name',
          avatar: profile.avatar_url,
          initials: getInitials(fullName, supabaseUser.email) || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          status: profile.status,
          sidebar_order: profile.sidebar_order,
          permissions: roleData?.permissions || [],
        };
        setUser(userToSet);
        localStorage.setItem('lastUserName', userToSet.name); // Store user name
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setUser(null);
        return;
      }

      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }

    console.warn(`Could not fetch user profile for ${supabaseUser.id} after ${retries} attempts. Using fallback data.`);
    const fallbackUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.email || 'New User',
      avatar: undefined,
      initials: getInitials('', supabaseUser.email) || 'NN',
      permissions: [],
    };
    setUser(fallbackUser);
    localStorage.setItem('lastUserName', fallbackUser.name); // Store fallback name
  };

  useEffect(() => {
    const getSessionAndListen = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession) {
        await fetchUserProfile(initialSession.user);
      } else {
        setUser(null);
      }
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password');
        }
        if (event === 'SIGNED_OUT') {
          toast.success("You have been successfully logged out.");
        }
        // **START: Perbaikan untuk sesi tidak valid**
        if (event === 'TOKEN_REFRESHED' && !newSession) {
          console.warn('Token refresh failed, forcing logout.');
          await supabase.auth.signOut();
        }
        // **END: Perbaikan untuk sesi tidak valid**
        setSession(newSession);
        if (newSession) {
          await fetchUserProfile(newSession.user);
        } else {
          setUser(null);
          localStorage.removeItem('lastUserName'); // Clear on logout
        }
      });

      return subscription;
    };

    const subscriptionPromise = getSessionAndListen();

    return () => {
      subscriptionPromise.then(subscription => subscription?.unsubscribe());
    };
  }, [navigate]);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchUserProfile(session.user);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      console.error("Error logging out:", error);
      toast.error("Logout failed. Please try again.");
    } else {
      setUser(null);
      setSession(null);
      localStorage.removeItem('lastUserName'); // Also clear on explicit logout
      navigate('/', { replace: true });
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'master admin') return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const value = {
    session,
    user,
    loading,
    logout,
    refreshUser,
    hasPermission,
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