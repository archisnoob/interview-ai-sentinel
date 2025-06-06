
import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemPreference = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Resolve the actual theme based on current theme setting
  const resolveTheme = (themeValue: Theme): 'light' | 'dark' => {
    if (themeValue === 'system') {
      return getSystemPreference();
    }
    return themeValue;
  };

  // Apply theme to document
  const applyTheme = (resolvedTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
    
    // Apply new theme
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }

    // Update color scheme for browsers
    root.style.colorScheme = resolvedTheme;
  };

  // Set theme with persistence
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }

    // Apply the resolved theme
    const resolved = resolveTheme(newTheme);
    setActualTheme(resolved);
    applyTheme(resolved);
  };

  // Toggle between light and dark (skips system)
  const toggleTheme = () => {
    if (theme === 'system') {
      const systemPref = getSystemPreference();
      setTheme(systemPref === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    // Get saved theme from localStorage
    let savedTheme: Theme = 'system';
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        savedTheme = stored;
      }
    } catch (error) {
      console.warn('Failed to read theme preference from localStorage:', error);
    }

    // Set initial theme
    setThemeState(savedTheme);
    const resolved = resolveTheme(savedTheme);
    setActualTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setActualTheme(newSystemTheme);
      applyTheme(newSystemTheme);
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  };
};
