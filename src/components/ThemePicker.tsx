import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { ThemeMode } from '../context/ThemeContext';

const themeOptions: ReadonlyArray<{
  mode: ThemeMode;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
}> = [
  { mode: 'light',  label: 'Light',  icon: 'sunny-outline',          accessibilityLabel: 'Light theme' },
  { mode: 'dark',   label: 'Dark',   icon: 'moon-outline',           accessibilityLabel: 'Dark theme' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline', accessibilityLabel: 'System theme' },
];

export function ThemePicker() {
  const { mode, setMode, colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.borderMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 4 }}>
      {themeOptions.map((option) => {
        const selected = mode === option.mode;
        const fg = selected ? colors.accentText : colors.textSecondary;

        return (
          <Pressable
            key={option.mode}
            onPress={() => setMode(option.mode)}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              borderRadius: 8,
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: selected ? colors.accent : 'transparent',
            }}
          >
            <Ionicons name={option.icon} size={16} color={fg} />
            <Text style={{ color: fg, fontSize: 13, fontWeight: '700' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
