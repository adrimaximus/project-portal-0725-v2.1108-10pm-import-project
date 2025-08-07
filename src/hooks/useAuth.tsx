import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  refreshGoogleToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState({ name: "Demo User" }); // Mock user
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const refreshGoogleToken = async (): Promise<string | null> => {
    console.log("Refreshing Google token...");
    // In a real app, you'd use a refresh token to get a new access token.
    // For this demo, we'll clear the token to force re-authentication.
    setGoogleAccessToken(null);
    return null;
  };

  const value = { user, googleAccessToken, setGoogleAccessToken, refreshGoogleToken };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};