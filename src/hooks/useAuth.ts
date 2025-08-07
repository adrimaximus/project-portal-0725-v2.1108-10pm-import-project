import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any;
  googleAccessToken: string | null;
  refreshGoogleToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState({ name: "Demo User" }); // Mock user
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    "mock_google_access_token"
  );

  const refreshGoogleToken = async (): Promise<string | null> => {
    console.log("Refreshing Google token...");
    const newAccessToken = `mock_google_access_token_${Date.now()}`;
    setGoogleAccessToken(newAccessToken);
    return newAccessToken;
  };

  const value = { user, googleAccessToken, refreshGoogleToken };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};