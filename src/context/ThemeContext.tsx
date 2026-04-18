import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { darkColors, lightColors, type ThemeColors } from '../theme';
import { storage } from '../storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveMode: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_PREFERENCE_KEY = '@theme_preference';

function isThemeMode(v: string | null): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { setColorScheme: nwSetColorScheme } = useNativeWindColorScheme();

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);

  // Load stored preference on mount
  useEffect(() => {
    storage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => { if (isThemeMode(stored)) setModeState(stored); })
      .catch(() => {})
      .finally(() => {
        isLoadedRef.current = true;
        setIsLoaded(true);
      });
  }, []);

  // Stable setter — closes over ref so no deps needed
  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    if (!isLoadedRef.current) return;
    storage.setItem(THEME_PREFERENCE_KEY, nextMode).catch(() => {});
  }, []);

  const effectiveMode = mode === 'system' ? (systemScheme ?? 'dark') : mode;

  // Sync NativeWind class-based dark mode whenever effectiveMode changes
  useEffect(() => {
    nwSetColorScheme(effectiveMode);
  }, [effectiveMode, nwSetColorScheme]);

  const colors = effectiveMode === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    setMode,
    effectiveMode,
    colors,
    isDark: effectiveMode === 'dark',
    isLoaded,
  }), [mode, setMode, effectiveMode, colors, isLoaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
