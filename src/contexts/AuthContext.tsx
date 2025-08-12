import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export type EnhancedUser = User & { name: string };

export interface AuthContextType {
  user: EnhancedUser | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateUserProfile = async (currentUser: User | null) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', currentUser.id)
          .single();

        const name = (profile && `${profile.first_name || ''} ${profile.last_name || ''}`.trim()) || currentUser.email || 'User';
        setUser({ ...currentUser, name });
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Fallback to email if profile fetch fails
        setUser({ ...currentUser, name: currentUser.email || 'User' });
      }
    };

    const getInitialSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await updateUserProfile(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        await updateUserProfile(session?.user ?? null);
        // No need to set loading here as it's for subsequent changes
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};