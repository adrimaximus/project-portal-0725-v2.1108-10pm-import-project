import { createContext, useContext, useState, ReactNode } from 'react';

// Define the User type
export interface User {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  role: 'Admin' | 'User';
}

// Define the context type
interface UserContextType {
  user: User;
  setUser: (user: User) => void;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Dummy user for initial state
const dummyUser: User = {
  id: 'user-1',
  name: 'Alice Johnson',
  avatar: '/avatars/01.png',
  initials: 'AJ',
  role: 'Admin',
};

// Create the provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(dummyUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};