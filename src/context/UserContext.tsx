import { createContext, useState, ReactNode, useContext } from 'react';

type User = {
  name: string;
  email: string;
  avatar: string;
};

type UserContextType = {
  user: User;
  updateUser: (user: Partial<User>) => void;
};

const defaultUser: User = {
  name: 'Alex',
  email: 'alex@example.com',
  avatar: 'https://github.com/shadcn.png',
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  const updateUser = (newUserData: Partial<User>) => {
    setUser(prevUser => ({ ...prevUser, ...newUserData }));
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