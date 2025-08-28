import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';

interface ProfileWithPermissions {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  sidebar_order: string[] | null;
  permissions: string[] | null;
}

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
          avatar: profile.avatar_url || undefined,
          initials: getInitials(fullName, supabaseUser.email) || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role || undefined,
          status: profile.status || undefined,
          sidebar_order: profile.sidebar_order || undefined,
          permissions: profile.permissions || [],
        };
        setUser(userToSet);
        localStorage.setItem('lastUserName', userToSet.name); // Store user name
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        // Do not set user to null on a transient error.
        // The protected route will show a loading screen if user is null.
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
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession) {
        await fetchUserProfile(initialSession.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
      localStorage.removeItem('lastUserName');
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