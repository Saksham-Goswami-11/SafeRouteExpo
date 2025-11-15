import React, { createContext, useContext, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

export type ColorsType = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundLight: string;
  backgroundCard: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  safe: string;
  warning: string;
  danger: string;
  border: string;
};

const lightColors: ColorsType = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  background: '#F7F9FC',
  backgroundLight: '#EDF2F7',
  backgroundCard: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  safe: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
};

const darkColors: ColorsType = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  background: '#0F0F1E',
  backgroundLight: '#1A1A2E',
  backgroundCard: '#16213E',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  safe: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#374151',
};

export type ThemeContextType = {
  colors: ColorsType;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemPref = Appearance.getColorScheme() === 'dark';
  const [darkMode, setDarkMode] = useState<boolean>(systemPref);

  const colors = useMemo(() => (darkMode ? darkColors : lightColors), [darkMode]);

  return (
    <ThemeContext.Provider value={{ colors, darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
