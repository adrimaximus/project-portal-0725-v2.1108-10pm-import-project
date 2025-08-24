import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';
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
        localStorage.setItem('lastUserName', userToSet.name);
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
    localStorage.setItem('lastUserName', fallbackUser.name);
  };

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        localStorage.removeItem('lastUserName');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchUserProfile(session.user);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    setUser(null);
    setSession(null);
    localStorage.removeItem('lastUserName');
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