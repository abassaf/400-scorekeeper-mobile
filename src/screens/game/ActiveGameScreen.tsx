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
  const { saveGame } = useGameHistory();
  const { showShareSheet, captureModal } = useShare();
  const savedRef = useRef(false);

  React.useEffect(() => {
    if (state.phase === 'finished' && !savedRef.current) {
      savedRef.current = true;
      saveGame(state);
    }
    if (state.phase !== 'finished') savedRef.current = false;
  }, [state.phase, state, saveGame]);

  const handleSave = useCallback(async () => {
    await saveGame(state);
    Alert.alert('Saved', 'Game saved to history.');
  }, [state, saveGame]);

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
        <RoundHistoryCard state={state} />
        <PlayerStatsCard state={state} />
      </ScrollView>
      {captureModal}
    </SafeAreaView>
  );
}
