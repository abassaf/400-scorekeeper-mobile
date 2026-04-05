import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface ScoreProgressBarProps {
  value: number;
  limit: number;
}

export function ScoreProgressBar({ value, limit }: ScoreProgressBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  const pct = limit > 0 ? Math.min(Math.max(value / limit, 0), 1) : 0;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: pct,
      useNativeDriver: false,
      damping: 15,
      stiffness: 120,
    } as Animated.SpringAnimationConfig).start();
  }, [pct, animValue]);

  const width = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="h-2 rounded-full bg-zinc-800 overflow-hidden">
      <Animated.View
        style={{ width }}
        className="h-2 rounded-full bg-emerald-500"
      />
    </View>
  );
}
