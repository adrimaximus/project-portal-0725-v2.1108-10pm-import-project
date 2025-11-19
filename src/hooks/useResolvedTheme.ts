import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeProvider"

export function useResolvedTheme() {
  const { theme } = useTheme()

  const getResolvedTheme = (t: string): "light" | "dark" => {
    if (t === "system") {
      return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches 
        ? "dark" 
        : "light"
    }
    
    // List of themes that should be treated as dark mode
    // Based on globals.css definitions
    const darkThemes = ["dark", "claude", "nature", "corporate", "ahensi", "brand-activator"];
    
    if (darkThemes.includes(t)) {
        return "dark";
    }
    
    return "light";
  }

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => getResolvedTheme(theme))

  useEffect(() => {
    setResolvedTheme(getResolvedTheme(theme))
    
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light")
      }
      
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  return resolvedTheme
}