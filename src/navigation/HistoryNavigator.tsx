import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from './types';
import { HistoryListScreen } from '../screens/history/HistoryListScreen';
import { HistoryDetailScreen } from '../screens/history/HistoryDetailScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="HistoryList"
        component={HistoryListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={{ title: 'Game Detail' }}
      />
    </Stack.Navigator>
  );
}
