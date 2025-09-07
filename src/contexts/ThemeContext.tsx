import React, { createContext, useContext, useState, useEffect } from 'react';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const [isDark, setIsDark] = useState(true);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('tams-theme') as ColorScheme;
    if (savedTheme) {
      setColorScheme(savedTheme);
    } else {
      // Default to dark mode for new users
      setColorScheme('dark');
    }
  }, []);

  // Update isDark based on colorScheme
  useEffect(() => {
    if (colorScheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    } else {
      setIsDark(colorScheme === 'dark');
    }
  }, [colorScheme]);

  // Set data attribute on document for Mantine's color scheme
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    }
  }, [isDark]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (colorScheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined;
  }, [colorScheme]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('tams-theme', colorScheme);
  }, [colorScheme]);

  const toggleTheme = () => {
    setColorScheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, isDark, toggleTheme }}>
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
