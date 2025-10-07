import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export type ThemePalette = "default" | "claude";
export type ThemeMode = "dark" | "light" | "system";

const themeClasses = ["light", "dark", "theme-claude", "theme-claude-light"];

interface ThemeProviderState {
  theme: ThemePalette;
  setTheme: (theme: ThemePalette) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const initialState: ThemeProviderState = {
  theme: "default",
  setTheme: () => null,
  mode: "system",
  setMode: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "default",
  defaultMode = "system",
  themeStorageKey = "vite-ui-theme-palette",
  modeStorageKey = "vite-ui-theme-mode",
}: {
  children: ReactNode
  defaultTheme?: ThemePalette
  defaultMode?: ThemeMode
  themeStorageKey?: string
  modeStorageKey?: string
}) {
  const [theme, setThemeState] = useState<ThemePalette>(
    () => (localStorage.getItem(themeStorageKey) as ThemePalette) || defaultTheme
  )
  const [mode, setModeState] = useState<ThemeMode>(
    () => (localStorage.getItem(modeStorageKey) as ThemeMode) || defaultMode
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove(...themeClasses)

    const effectiveMode = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;

    if (effectiveMode === 'dark') {
      root.classList.add('dark');
      if (theme === 'claude') {
        root.classList.add('theme-claude');
      }
    } else { // light
      root.classList.add('light');
      if (theme === 'claude') {
        root.classList.add('theme-claude-light');
      }
    }
  }, [theme, mode])

  const value = {
    theme,
    setTheme: (theme: ThemePalette) => {
      localStorage.setItem(themeStorageKey, theme)
      setThemeState(theme)
    },
    mode,
    setMode: (mode: ThemeMode) => {
      localStorage.setItem(modeStorageKey, mode)
      setModeState(mode)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}