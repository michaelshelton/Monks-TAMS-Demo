import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use light theme (but allow type to support dark/auto for compatibility)
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const isDark = false;

  const toggleTheme = useCallback(() => {
    // Theme toggle is disabled - always stays on light
    // This function exists for API compatibility but doesn't change the theme
  }, []);

  // Set data attribute on document for Mantine's color scheme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
