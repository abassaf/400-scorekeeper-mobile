import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { GameStackParamList } from './types';
import { SetupScreen } from '../screens/game/SetupScreen';
import { ActiveGameScreen } from '../screens/game/ActiveGameScreen';
import { useGameContext } from '../context/GameContext';
import type { GameState } from '../types';

const Stack = createNativeStackNavigator<GameStackParamList>();

function GameScreen() {
  const { state, dispatch } = useGameContext();
  const route = useRoute<RouteProp<GameStackParamList, 'Game'>>();

  React.useEffect(() => {
    const entry = route.params?.loadEntry;
    if (!entry) return;
    const loadedState: GameState = {
      phase: entry.winner ? 'finished' : 'playing',
      players: entry.players,
      scoreLimit: entry.scoreLimit,
      rounds: entry.rounds,
      winner: entry.winner,
    };
    dispatch({ type: 'LOAD_STATE', state: loadedState });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.loadEntry]);

  return state.phase === 'setup' ? (
    <SetupScreen state={state} dispatch={dispatch} />
  ) : (
    <ActiveGameScreen state={state} dispatch={dispatch} />
  );
}

export function GameNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Game" component={GameScreen} />
    </Stack.Navigator>
  );
}
