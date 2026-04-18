import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ScoreProgressBarProps {
  value: number;
  limit: number;
  fillColor?: string;
}

export function ScoreProgressBar({ value, limit, fillColor }: ScoreProgressBarProps) {
  const { colors } = useTheme();
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
    <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.progressTrack, overflow: 'hidden' }}>
      <Animated.View
        style={{ width, height: 8, borderRadius: 999, backgroundColor: fillColor ?? colors.accent }}
      />
    </View>
  );
}
