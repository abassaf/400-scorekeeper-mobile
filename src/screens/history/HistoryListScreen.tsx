import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme';

// Full implementation in Wave B (Task 19)
export function HistoryListScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textPrimary }}>History</Text>
    </View>
  );
}
