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
    const initializeAuth = async () => {
      try {
        // Logika ini menangani callback setelah login OAuth.
        // `detectSessionInUrl` seharusnya melakukan ini, tetapi melakukannya secara eksplisit
        // di sini memastikan itu terjadi sebelum guard rute berjalan.
        if (location.search.includes('code=')) {
          await supabase.auth.exchangeCodeForSession(location.href);
          // Bersihkan URL dari parameter 'code' setelah pertukaran berhasil.
          const url = new URL(location.href);
          url.search = '';
          window.history.replaceState({}, document.title, url.pathname);
        }

        // Ambil sesi awal. Ini akan berisi sesi setelah pertukaran kode.
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          await fetchUserProfile(initialSession.user);
        }
      } catch (e) {
        console.error("Error during auth initialization:", e);
      } finally {
        // Penting: Atur loading ke false hanya setelah semua pemeriksaan awal selesai.
        setLoading(false);
      }
    };

    initializeAuth();

    // Dengarkan perubahan status otentikasi di masa mendatang (mis. logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchUserProfile(newSession.user);
      } else {
        setUser(null);
      }
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