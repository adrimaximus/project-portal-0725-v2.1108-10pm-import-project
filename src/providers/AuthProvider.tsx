import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SessionContextProvider, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';

type Profile = any; // You can define a more specific type for your profile

type AuthContextType = {
  session: Session | null;
  supabase: SupabaseClient;
  profile: Profile | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProviderContent = ({ children }: { children: ReactNode }) => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (user: User | undefined) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } else {
        setProfile(userProfile);
      }
      setLoading(false);
    };

    fetchProfile(session?.user);

  }, [session, supabase]);

  return (
    <AuthContext.Provider value={{ session, supabase, profile, isLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthProviderContent>
        {children}
      </AuthProviderContent>
    </SessionContextProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};