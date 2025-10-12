import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Theme } from "@/types";

const themeClasses = ["light", "dark", "theme-claude", "theme-claude-light", "theme-nature", "theme-nature-light"];

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string; // Kept for compatibility but unused
}) {
  const { user, refreshUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme as Theme);
    }
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...themeClasses);

    let effectiveTheme: Omit<Theme, "system"> = theme as Omit<Theme, "system">;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    switch (effectiveTheme) {
      case 'claude':
        root.classList.add('dark', 'theme-claude');
        break;
      case 'claude-light':
        root.classList.add('light', 'theme-claude-light');
        break;
      case 'nature':
        root.classList.add('dark', 'theme-nature');
        break;
      case 'nature-light':
        root.classList.add('light', 'theme-nature-light');
        break;
      case 'dark':
        root.classList.add('dark');
        break;
      case 'light':
      default:
        root.classList.add('light');
        break;
    }
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    if (!user) {
      toast.error("You must be logged in to change your theme.");
      return;
    }

    const oldTheme = theme;
    setThemeState(newTheme); // Optimistic update

    const { error } = await supabase
      .from('profiles')
      .update({ theme: newTheme })
      .eq('id', user.id);

    if (error) {
      setThemeState(oldTheme); // Revert on error
      toast.error("Failed to save your theme preference.");
    } else {
      await refreshUser(); // Refresh user context to ensure it's up-to-date
    }
  }, [user, theme, refreshUser]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};