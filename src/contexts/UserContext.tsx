import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/data/users';
import { useAuth } from '@/providers/AuthProvider';

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { profile, session, supabase } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile && session?.user) {
      const appUser: User = {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || session.user.email!,
        email: session.user.email!,
        avatar: profile.avatar_url,
        initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U',
      };
      setUser(appUser);
      localStorage.setItem('portal_user', JSON.stringify(appUser));
    } else if (!session) {
      setUser(null);
      localStorage.removeItem('portal_user');
    }
    
    if (session === null || (session && profile)) {
        setIsLoading(false);
    }
  }, [profile, session]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('portal_user', JSON.stringify(userData));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('portal_user');
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

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', session.user.id);

    if (error) {
      console.error("Error updating profile:", error);
    } else {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('portal_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
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