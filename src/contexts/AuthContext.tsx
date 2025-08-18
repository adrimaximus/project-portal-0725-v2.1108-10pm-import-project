import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';
import { showSuccess, showError } from '@/utils/toast';

interface AuthContextType {
  session: SupabaseSession | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        setUser({
          id: profile.id,
          email: supabaseUser.email,
          name: fullName || supabaseUser.email || 'No name',
          avatar: profile.avatar_url,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          status: profile.status,
          sidebar_order: profile.sidebar_order,
        });
        return; // Success, exit the function
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
        if (event === 'SIGNED_OUT') {
          showSuccess("You have been successfully logged out.");
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
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      console.error("Error logging out:", error);
      showError("Logout failed. Please try again.");
    }
  };

  const value = {
    session,
    user,
    loading,
    logout,
    refreshUser,
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