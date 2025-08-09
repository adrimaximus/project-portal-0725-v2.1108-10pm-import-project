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

  useEffect(() => {
    const bootstrapAuth = async () => {
      // Jika URL berisi kode, itu adalah pengalihan dari OAuth.
      // Kita harus menukarnya dengan sesi lalu membersihkan URL.
      if (window.location.search.includes("code=")) {
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
          // Alihkan ke path root untuk membersihkan kode dari URL.
          // Ini memicu pemuatan ulang aplikasi yang bersih, di mana getSession() akan berfungsi dengan benar.
          window.location.replace(window.location.origin);
        } catch (error) {
          console.error("Error exchanging code for session:", error);
          // Juga alihkan jika terjadi kesalahan agar tidak macet.
          window.location.replace(window.location.origin);
        }
        // Kembali di sini untuk mencegah eksekusi lebih lanjut hingga halaman dimuat ulang.
        return;
      }

      // Untuk pemuatan halaman normal (atau setelah pengalihan di atas).
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          await fetchUserProfile(session.user);
        }
      } catch (error) {
        console.error("Error during auth bootstrap:", error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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