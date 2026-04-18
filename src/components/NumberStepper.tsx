import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  sublabel?: string;
}

export function NumberStepper({ value, min, max, onChange, label, sublabel }: NumberStepperProps) {
  const { colors } = useTheme();

  async function step(delta: number) {
    const next = Math.min(Math.max(value + delta, min), max);
    if (next === value) return;
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
    }
    onChange(next);
  }

  const btnBase: React.ComponentProps<typeof Pressable>['style'] = {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.borderMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  };

  return (
    <View style={{ alignItems: 'center' }}>
      {label != null && (
        <Text
          style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 2, textAlign: 'center' }}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
      {sublabel != null && (
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 4 }}>{sublabel}</Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => step(-1)}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
          accessibilityRole="button"
          style={[btnBase, value <= min && { opacity: 0.35 }]}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '400', lineHeight: 26 }}>
            −
          </Text>
        </Pressable>

        <View
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value, text: `${value}` }}
          style={{ width: 40, alignItems: 'center' }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>{value}</Text>
        </View>

        <Pressable
          onPress={() => step(1)}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
          accessibilityRole="button"
          style={[btnBase, value >= max && { opacity: 0.35 }]}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '400', lineHeight: 26 }}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
