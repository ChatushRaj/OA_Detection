import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME, ThemeType } from '../styles/designTokens';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved !== null) {
        setIsDarkMode(saved === 'dark');
      } else {
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
  };

  const toggleTheme = async () => {
    try {
      const newVal = !isDarkMode;
      setIsDarkMode(newVal);
      await AsyncStorage.setItem('theme_mode', newVal ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
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
