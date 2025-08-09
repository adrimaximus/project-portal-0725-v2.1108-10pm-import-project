import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export type UserProfile = User & {
  first_name: string | null;
  last_name: string | null;
  name: string;
  avatar: string | null;
  initials: string;
};

type AuthContextType = {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitials = (fn?: string | null, ln?: string | null, fullName?: string | null, email?: string | null) => {
      if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
      if (fullName) return fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      if (fn) return fn.slice(0, 2).toUpperCase();
      if (email) return email.slice(0, 2).toUpperCase();
      return '??';
    }

    const setData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        const firstName = profile?.first_name || session.user.user_metadata.first_name;
        const lastName = profile?.last_name || session.user.user_metadata.last_name;
        const fullName = session.user.user_metadata.full_name;
        const email = session.user.email;

        const userData: UserProfile = {
          ...session.user,
          first_name: firstName || null,
          last_name: lastName || null,
          name: fullName || `${firstName || ''} ${lastName || ''}`.trim() || email || 'User',
          avatar: profile?.avatar_url || session.user.user_metadata.avatar_url || null,
          initials: getInitials(firstName, lastName, fullName, email),
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', session.user.id)
          .single();

        const firstName = profile?.first_name || session.user.user_metadata.first_name;
        const lastName = profile?.last_name || session.user.user_metadata.last_name;
        const fullName = session.user.user_metadata.full_name;
        const email = session.user.email;

        const userData: UserProfile = {
          ...session.user,
          first_name: firstName || null,
          last_name: lastName || null,
          name: fullName || `${firstName || ''} ${lastName || ''}`.trim() || email || 'User',
          avatar: profile?.avatar_url || session.user.user_metadata.avatar_url || null,
          initials: getInitials(firstName, lastName, fullName, email),
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signOut,
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