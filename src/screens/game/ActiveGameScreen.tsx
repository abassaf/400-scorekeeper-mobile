import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
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
import { ScoreSummaryCard } from '../../components/ScoreSummaryCard';
import { colors } from '../../theme';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; }

export function ActiveGameScreen({ state, dispatch }: Props) {
  const cardRef = useRef<View>(null);
  const { saveGame } = useGameHistory();
  const { showShareSheet } = useShare(cardRef);
  const savedRef = useRef(false);

  React.useEffect(() => {
    if (state.phase === 'finished' && !savedRef.current) {
      savedRef.current = true;
      saveGame(state);
    }
    if (state.phase !== 'finished') savedRef.current = false;
  }, [state.phase, state, saveGame]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {state.phase === 'finished' && (
          <WinnerBannerCard state={state} dispatch={dispatch} onShare={() => showShareSheet(state)} />
        )}
        <ScoreHeaderCard state={state} onNewGame={() => dispatch({ type: 'NEW_GAME' })} onShare={() => showShareSheet(state)} />
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
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ScoreSummaryCard ref={cardRef} state={state} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
