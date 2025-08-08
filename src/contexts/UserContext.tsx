import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/data/users';

interface UserContextType {
  user: User | null;
  session: Session | null;
  supabase: SupabaseClient;
  isLoading: boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false); // Stop loading as soon as session is known

      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user && profile) {
      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || session.user.email!;
      const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || session.user.email![0].toUpperCase();
      
      const appUser: User = {
        id: session.user.id,
        name: name,
        email: session.user.email!,
        avatar: profile.avatar_url,
        initials: initials,
      };
      setUser(appUser);
    } else if (!session?.user) {
      setUser(null);
    }
  }, [session, profile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!session?.user || !user) return;

    const profileUpdates: { first_name?: string; last_name?: string; avatar_url?: string } = {};
    if (updates.name) {
      const nameParts = updates.name.split(' ');
      profileUpdates.first_name = nameParts[0];
      profileUpdates.last_name = nameParts.slice(1).join(' ');
    }
    if (updates.avatar) {
      profileUpdates.avatar_url = updates.avatar;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
    } else {
      setProfile(data);
    }
  };

  const value = {
    user,
    session,
    supabase,
    isLoading,
    logout,
    updateUser,
  };

  return (
    <UserContext.Provider value={value}>
      {isLoading ? <div className="flex h-screen w-full items-center justify-center">Loading...</div> : children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};