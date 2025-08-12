
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export const useTheme = () => {
  const { theme, setTheme, ...rest } = useNextTheme();
  
  // This custom hook will combine the light/dark mode with a color theme.
  // e.g. "dark-forest" or "light-ocean"
  const [mode = "light", color = "miin"] = theme?.split("-") || [];

  const setCurrentTheme = (newTheme: string) => {
    if (newTheme.includes("-")) {
      setTheme(newTheme);
    } else {
      // It's just a mode change (light, dark, system)
      const current_color = color || 'miin';
      setTheme(`${newTheme}-${current_color}`);
    }
  }

  return { theme, setTheme: setCurrentTheme, mode, color, ...rest };
};
