import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';

export type EnhancedUser = User;

export interface AuthContextType {
  user: EnhancedUser | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (currentUser: SupabaseUser | null): Promise<EnhancedUser | null> => {
    if (!currentUser) {
      return null;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', currentUser.id)
        .single();

      const name = (profile && `${profile.first_name || ''} ${profile.last_name || ''}`.trim()) || currentUser.email || 'User';
      const initials = (profile && `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()) || 'U';
      
      return {
        id: currentUser.id,
        email: currentUser.email,
        name,
        avatar: profile?.avatar_url || undefined,
        initials,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.email || 'User',
        initials: 'U',
      };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    const enhancedUser = await fetchUserProfile(supabaseUser);
    setUser(enhancedUser);
  }, [fetchUserProfile]);

  useEffect(() => {
    const getInitialSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const enhancedUser = await fetchUserProfile(session?.user ?? null);
      setUser(enhancedUser);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const enhancedUser = await fetchUserProfile(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    isLoading,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};