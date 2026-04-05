import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import { useShare } from '../../hooks/useShare';
import { ScoreHeaderCard } from '../game/ScoreHeaderCard';
import { RoundHistoryCard } from '../game/RoundHistoryCard';
import { PlayerStatsCard } from '../game/PlayerStatsCard';
import { WinnerBannerCard } from '../game/WinnerBannerCard';
import { ScoreSummaryCard } from '../../components/ScoreSummaryCard';
import { colors } from '../../theme';
import type { GameState } from '../../types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryDetail'>;

export function HistoryDetailScreen({ route, navigation }: Props) {
  const { entry } = route.params;
  const cardRef = useRef<View>(null);
  const state: GameState = { phase: 'finished', players: entry.players, scoreLimit: entry.scoreLimit, rounds: entry.rounds, winner: entry.winner };
  const { showShareSheet } = useShare(cardRef);
  const noop = () => undefined;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: `${entry.players[0]} & ${entry.players[1]} vs ${entry.players[2]} & ${entry.players[3]}` });
  }, [navigation, entry]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <WinnerBannerCard state={state} dispatch={noop} onShare={() => showShareSheet(state)} />
        <ScoreHeaderCard state={state} onNewGame={noop} onShare={() => showShareSheet(state)} />
        <RoundHistoryCard state={state} />
        <PlayerStatsCard state={state} />
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ScoreSummaryCard ref={cardRef} state={state} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
