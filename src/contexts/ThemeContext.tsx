import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use dark theme for the new design
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const isDark = true;

  const toggleTheme = useCallback(() => {
    // Theme toggle functionality - can be enabled later if needed
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
  }, [colorScheme]);

  // Set data attribute on document for Mantine's color scheme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorScheme);
    document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme);
  }, [colorScheme]);

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
