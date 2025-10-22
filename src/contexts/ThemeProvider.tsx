import { createContext, useContext, useEffect, useState } from "react"
import type { Theme } from "@/types"

const ALL_THEME_CLASSES = [
  "theme-claude",
  "theme-claude-light",
  "theme-nature",
  "theme-nature-light",
  "theme-corporate",
  "theme-corporate-light",
  "theme-ahensi",
  "theme-ahensi-light",
  "theme-brand-activator",
  "theme-brand-activator-light",
]

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark", ...ALL_THEME_CLASSES)

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    const isDark = theme === 'dark' || !theme.endsWith('-light');
    root.classList.add(isDark ? 'dark' : 'light');
    
    const themeClass = theme === 'dark' || theme === 'light' ? '' : `theme-${theme}`;
    if (themeClass) {
      root.classList.add(themeClass);
    }

  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
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