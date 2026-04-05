import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ENABLE_IAP, purchaseTip } from '../services/iap';

export function SupportButton() {
  async function handlePress() {
    if (!ENABLE_IAP) {
      Alert.alert('Coming Soon', 'Tip support is not available yet. Thanks for your interest!');
      return;
    }
    await purchaseTip();
  }

  return (
    <View className="items-center py-4">
      <Pressable
        onPress={handlePress}
        accessibilityLabel="Support the developer with a one-time tip"
        accessibilityRole="button"
        className="bg-zinc-800 px-6 py-3 rounded-xl active:bg-zinc-700"
      >
        <Text className="text-white font-semibold">Support the Dev ☕</Text>
      </Pressable>
      <Text className="text-zinc-600 text-xs mt-2">One-time optional tip</Text>
    </View>
  );
}
