import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  sublabel?: string;
}

export function NumberStepper({ value, min, max, onChange, label, sublabel }: NumberStepperProps) {
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

  return (
    <View className="items-center">
      {label != null && (
        <Text
          className="text-xs font-medium text-zinc-400 mb-0.5 text-center"
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
      {sublabel != null && (
        <Text className="text-xs text-zinc-600 text-center mb-1">{sublabel}</Text>
      )}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => step(-1)}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
          accessibilityRole="button"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          className="bg-zinc-800 rounded-lg active:bg-zinc-700"
        >
          <Text
            style={{ color: value <= min ? colors.textSubtle : colors.textPrimary }}
            className="text-xl font-semibold"
          >
            −
          </Text>
        </Pressable>

        <View
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value, text: `${value}` }}
          style={{ width: 40, alignItems: 'center' }}
        >
          <Text className="text-white text-lg font-bold">{value}</Text>
        </View>

        <Pressable
          onPress={() => step(1)}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
          accessibilityRole="button"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          className="bg-zinc-800 rounded-lg active:bg-zinc-700"
        >
          <Text
            style={{ color: value >= max ? colors.textSubtle : colors.textPrimary }}
            className="text-xl font-semibold"
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
