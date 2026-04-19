import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootTabParamList } from './types';
import { GameNavigator } from './GameNavigator';
import { HistoryNavigator } from './HistoryNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accentFg,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="GameTab"
        component={GameNavigator}
        options={{
          tabBarLabel: 'Game',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'game-controller' : 'game-controller-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryNavigator}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
