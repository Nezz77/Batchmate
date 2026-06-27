import React, { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'dark' | 'light';
type Theme = 'ocean' | 'sunset' | 'emerald' | 'amethyst';

interface ThemeContextType {
  mode: Mode;
  theme: Theme;
  setMode: (mode: Mode) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const savedMode = localStorage.getItem('app-mode') as Mode;
    return savedMode || 'dark';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme || 'ocean';
  });

  useEffect(() => {
    localStorage.setItem('app-mode', mode);
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, setTheme }}>
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
