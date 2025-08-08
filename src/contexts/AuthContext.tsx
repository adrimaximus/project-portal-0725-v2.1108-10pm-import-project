import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  email: string | undefined;
  avatar: string | null;
  initials: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (updates: { first_name?: string; last_name?: string; }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = async (supabaseUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      return;
    }

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    const initials = (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '');

    setUser({
      id: supabaseUser.id,
      name: fullName || supabaseUser.email || 'No name',
      email: supabaseUser.email,
      avatar: profile.avatar_url,
      initials: initials.toUpperCase() || '??',
    });
  };

  useEffect(() => {
    const setData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchAndSetUser(session.user);
      }
      setIsLoading(false);
    };

    setData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchAndSetUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: { first_name?: string; last_name?: string; }) => {
    if (!user) return;
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return;
    }

    if (data) {
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
        const initials = (data.first_name?.[0] || '') + (data.last_name?.[0] || '');
        setUser(prev => prev ? ({
            ...prev,
            name: fullName,
            initials: initials.toUpperCase() || '??',
        }) : null);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};