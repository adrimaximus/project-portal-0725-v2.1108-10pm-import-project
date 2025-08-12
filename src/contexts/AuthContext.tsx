import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';

interface AuthContextType {
  session: SupabaseSession | null;
  user: User | null;
  loading: boolean;
  isFreshLogin: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearFreshLoginFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFreshLogin, setIsFreshLogin] = useState(false);
  const navigate = useNavigate();

  const fetchUserProfile = async (supabaseUser: SupabaseUser, retries = 3, delay = 500) => {
    for (let i = 0; i < retries; i++) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', supabaseUser.id)
        .single();

      if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        setUser({
          id: profile.id,
          email: supabaseUser.email,
          name: fullName || supabaseUser.email || 'No name',
          avatar: profile.avatar_url,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        });
        return; // Success, exit the function
      }

      // If there's an error but it's not "row not found", log it and stop.
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setUser(null);
        return;
      }

      // If no profile was found (PGRST116 or no error but null data), wait and retry.
      // This handles the small delay for new user profile creation via trigger.
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    }

    // If still no profile after all retries, create a fallback user object.
    console.warn(`Could not fetch user profile for ${supabaseUser.id} after ${retries} attempts. Using fallback data.`);
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.email || 'New User',
      avatar: undefined,
      initials: supabaseUser.email?.substring(0, 2).toUpperCase() || 'NN',
    });
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

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          navigate('/reset-password');
        }
        if (event === 'SIGNED_IN') {
          setIsFreshLogin(true);
        }
        setSession(newSession);
        if (newSession) {
          fetchUserProfile(newSession.user);
        } else {
          setUser(null);
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsFreshLogin(false);
  };

  const clearFreshLoginFlag = useCallback(() => {
    setIsFreshLogin(false);
  }, []);

  const value = {
    session,
    user,
    loading,
    isFreshLogin,
    logout,
    refreshUser,
    clearFreshLoginFlag,
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