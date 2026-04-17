import React, { useRef, useCallback } from 'react';
import { ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useShare } from '../../hooks/useShare';
import { ScoreHeaderCard } from './ScoreHeaderCard';
import { RoundFormCard } from './RoundFormCard';
import { RoundHistoryCard } from './RoundHistoryCard';
import { PlayerStatsCard } from './PlayerStatsCard';
import { WinnerBannerCard } from './WinnerBannerCard';
import { colors } from '../../theme';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export function ActiveGameScreen({ state, dispatch }: Props) {
  const { saveGame, updateGame } = useGameHistory();
  const { showShareSheet, captureModal } = useShare();
  const savedRef = useRef(false);
  const savedGameIdRef = useRef<string | null>(null);

  React.useEffect(() => {
    if (state.phase === 'finished') {
      if (!savedRef.current) {
        savedRef.current = true;
        saveGame(state).then((id) => {
          if (id) savedGameIdRef.current = id;
        });
      } else if (savedGameIdRef.current) {
        updateGame(savedGameIdRef.current, state);
      }
    }
    if (state.phase !== 'finished') {
      savedRef.current = false;
      savedGameIdRef.current = null;
    }
  }, [state.phase, state, saveGame, updateGame]);

  const handleSave = useCallback(async () => {
    if (savedGameIdRef.current) {
      await updateGame(savedGameIdRef.current, state);
    } else {
      const id = await saveGame(state);
      if (id) savedGameIdRef.current = id;
    }
    Alert.alert('Saved', 'Game saved to history.');
  }, [state, saveGame, updateGame]);

  const handleNewGame = useCallback(() => {
    if (state.phase === 'playing' && state.rounds.length > 0) {
      Alert.alert(
        'New Game',
        'Save this game to history before starting a new one?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => dispatch({ type: 'NEW_GAME' }),
          },
          {
            text: 'Save',
            onPress: async () => {
              await saveGame(state);
              dispatch({ type: 'NEW_GAME' });
            },
          },
        ],
      );
    } else {
      dispatch({ type: 'NEW_GAME' });
    }
  }, [state, dispatch, saveGame]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {state.phase === 'finished' && (
          <WinnerBannerCard state={state} dispatch={dispatch} onShare={() => showShareSheet(state)} />
        )}
        <ScoreHeaderCard state={state} onNewGame={handleNewGame} onShare={() => showShareSheet(state)} onSave={handleSave} />
        {state.phase === 'playing' && (
          <RoundFormCard
            players={state.players}
            roundsPlayed={state.rounds.length}
            onSubmit={(entries) => dispatch({ type: 'ADD_ROUND', entries })}
            onUndo={() => dispatch({ type: 'UNDO_ROUND' })}
          />
        )}
        <RoundHistoryCard state={state} dispatch={dispatch} />
        <PlayerStatsCard state={state} />
      </ScrollView>
      {captureModal}
    </SafeAreaView>
  );
}
