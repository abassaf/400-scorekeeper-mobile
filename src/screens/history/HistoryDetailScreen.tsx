import React from 'react';
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryDetail'>;

// Full implementation in Wave B (Task 20)
export function HistoryDetailScreen({ route: _route }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textPrimary }}>Game Detail</Text>
    </View>
  );
}
