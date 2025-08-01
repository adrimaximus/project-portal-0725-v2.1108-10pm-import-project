import { createContext, useContext, ReactNode, useState } from 'react';
import { GlobalRole } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  role: GlobalRole;
}

interface UserContextType {
  user: User;
  updateUser: (data: Partial<User>) => void;
}

// In a real application, this user data would come from an authentication service.
const defaultUser: User = {
  id: 'user-1',
  name: 'Alex',
  email: 'alex@example.com',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  initials: 'A',
  role: 'Admin',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  const updateUser = (data: Partial<User>) => {
    setUser(prevUser => ({ ...prevUser, ...data }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
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