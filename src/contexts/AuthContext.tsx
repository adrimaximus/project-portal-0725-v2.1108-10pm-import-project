import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, SupabaseSession, SupabaseUser } from '@/types';

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

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    } else if (profile) {
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
    }
  };

  useEffect(() => {
    const initializeAndListen = async () => {
      setLoading(true);

      // 1. Menangani pengalihan OAuth jika ada
      if (window.location.search.includes('code=')) {
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState({}, document.title, url.toString());
        } catch (error) {
          console.error('Error exchanging code for session:', error);
        }
      }

      // 2. Mendapatkan sesi awal dan mengatur pengguna
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        await fetchUserProfile(initialSession.user);
      } else if (import.meta.env.DEV) {
        console.log("DEV MODE: No session found, attempting to log in as a development user.");
        const { data: devProfile, error: devProfileError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();

        if (devProfileError) {
          console.error("DEV MODE: Could not fetch a dev user profile. Please ensure at least one user exists in the 'profiles' table.", devProfileError);
          setUser(null);
        } else if (devProfile) {
          console.log(`DEV MODE: Successfully logged in as: ${devProfile.first_name} ${devProfile.last_name}`);
          const fullName = `${devProfile.first_name || ''} ${devProfile.last_name || ''}`.trim();
          setUser({
            id: devProfile.id,
            email: devProfile.email || 'dev-user@example.com',
            name: fullName || 'Dev User',
            avatar: devProfile.avatar_url,
            initials: `${devProfile.first_name?.[0] || 'D'}${devProfile.last_name?.[0] || 'U'}`.toUpperCase(),
            first_name: devProfile.first_name,
            last_name: devProfile.last_name,
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);

      // 3. Menyiapkan listener untuk perubahan selanjutnya
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          await fetchUserProfile(newSession.user);
        } else {
          // Jika logout dalam mode dev, jangan login kembali secara otomatis sebagai pengguna dev.
          // Cukup bersihkan pengguna. Pengguna dev hanya untuk pemuatan awal.
          setUser(null);
        }
      });

      return subscription;
    };

    const subscriptionPromise = initializeAndListen();

    return () => {
      subscriptionPromise.then(subscription => subscription?.unsubscribe());
    };
  }, []);

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