import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/data/users';

interface UserContextType {
  user: User;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void; // Added updateUser
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    role: 'Admin',
    avatar: 'https://i.pravatar.cc/150?u=alice',
    initials: 'AJ'
  });

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    console.log("User logged out");
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prevUser => ({ ...prevUser, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
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