import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeProvider"

export function useResolvedTheme() {
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    theme === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : (theme as "light" | "dark")
  )

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light")
      }
      // Set initial value based on current system setting
      handleChange()
      
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      setResolvedTheme(theme as "light" | "dark")
    }
  }, [theme])

  return resolvedTheme
}