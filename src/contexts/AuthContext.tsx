import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';

interface AuthContextType {
  user: User | null;
  session: SupabaseSession | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      const fallbackUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata.full_name || supabaseUser.email || 'Anonymous',
        avatar_url: supabaseUser.user_metadata.avatar_url || null,
        first_name: supabaseUser.user_metadata.first_name || null,
        last_name: supabaseUser.user_metadata.last_name || null,
        initials: ((supabaseUser.user_metadata.first_name?.[0] || '') + (supabaseUser.user_metadata.last_name?.[0] || '')).toUpperCase() || 'NN',
      };
      setUser(fallbackUser);
      return;
    }

    if (profile) {
      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Anonymous';
      const initials = ((profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')).toUpperCase() || 'NN';
      setUser({ ...profile, name, initials });
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      if (_event !== 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};