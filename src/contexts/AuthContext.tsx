import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  notification_preferences: any;
  permissions: string[];
  [key: string]: any;
}

export interface User extends SupabaseUser {
  profile: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const fetchProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_user_profile_with_permissions', { p_user_id: supabaseUser.id })
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      setError(profileError as unknown as AuthError);
      setUser({ ...supabaseUser, profile: null });
    } else {
      setUser({ ...supabaseUser, profile: profileData });
    }
  }, []);

  const refetchProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError(sessionError);
      } else if (session) {
        setSession(session);
        await fetchProfile(session.user);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        if (_event !== 'USER_UPDATED' || !user) {
          await fetchProfile(session.user);
        }
      } else {
        setUser(null);
      }
      if (_event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchProfile, user]);

  const value = {
    user,
    session,
    loading,
    error,
    refetchProfile,
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