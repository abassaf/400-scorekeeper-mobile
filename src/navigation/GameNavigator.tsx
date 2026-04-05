import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GameStackParamList } from './types';
import { SetupScreen } from '../screens/game/SetupScreen';
import { ActiveGameScreen } from '../screens/game/ActiveGameScreen';
import { useGameState } from '../hooks/useGameState';

const Stack = createNativeStackNavigator<GameStackParamList>();

export function GameNavigator() {
  const { state, dispatch } = useGameState();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Game">
        {() =>
          state.phase === 'setup' ? (
            <SetupScreen state={state} dispatch={dispatch} />
          ) : (
            <ActiveGameScreen state={state} dispatch={dispatch} />
          )
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
}
