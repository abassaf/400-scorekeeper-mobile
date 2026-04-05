import React from 'react';
import { View, Text } from 'react-native';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';
import { colors } from '../../theme';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

// Full implementation wired in Wave B (Task 18)
export function ActiveGameScreen({ state: _state, dispatch: _dispatch }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textPrimary }}>Active Game Screen</Text>
    </View>
  );
}
