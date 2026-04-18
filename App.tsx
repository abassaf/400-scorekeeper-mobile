import './global.css';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootTabs } from './src/navigation/RootTabs';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function AppNavigation() {
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: {
      background: colors.bg,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
      notification: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
