import React from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import type { RootTabParamList } from '../../navigation/types';
import { useShare } from '../../hooks/useShare';
import { useGameHistory } from '../../hooks/useGameHistory';
import { ScoreHeaderCard } from '../game/ScoreHeaderCard';
import { RoundHistoryCard } from '../game/RoundHistoryCard';
import { PlayerStatsCard } from '../game/PlayerStatsCard';
import { WinnerBannerCard } from '../game/WinnerBannerCard';
import { colors } from '../../theme';
import type { GameState } from '../../types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryDetail'>;

export function HistoryDetailScreen({ route, navigation }: Props) {
  const { entry } = route.params;
  const state: GameState = { phase: entry.winner ? 'finished' : 'playing', players: entry.players, scoreLimit: entry.scoreLimit, rounds: entry.rounds, winner: entry.winner };
  const { showShareSheet, captureModal } = useShare();
  const { deleteGame } = useGameHistory();
  const rootNavigation = useNavigation<NavigationProp<RootTabParamList>>();
  const noop = () => undefined;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: `${entry.players[0]} & ${entry.players[1]} vs ${entry.players[2]} & ${entry.players[3]}` });
  }, [navigation, entry]);

  function handleLoadIntoGame() {
    const label = entry.winner ? 'Load this game into the Game tab? The current game will be replaced.' : 'Continue this game in the Game tab? The current game will be replaced.';
    Alert.alert(entry.winner ? 'Load into Game' : 'Continue Game', label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: entry.winner ? 'Load' : 'Continue',
        onPress: () => {
          rootNavigation.navigate('GameTab', { screen: 'Game', params: { loadEntry: entry } });
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert('Delete Game', 'Remove this game from history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGame(entry.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <WinnerBannerCard state={state} dispatch={noop} onShare={() => showShareSheet(state)} />
        <ScoreHeaderCard state={state} onNewGame={noop} onShare={() => showShareSheet(state)} />
        <RoundHistoryCard state={state} />
        <PlayerStatsCard state={state} />

        <View style={{ gap: 10, marginBottom: 16 }}>
          <Pressable
            onPress={handleLoadIntoGame}
            accessibilityLabel={entry.winner ? 'Load into game' : 'Continue this game'}
            accessibilityRole="button"
            style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {entry.winner ? 'Load into Game' : 'Continue Game'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityLabel="Delete this game from history"
            accessibilityRole="button"
            style={{ backgroundColor: colors.dangerBg, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.danger }}
          >
            <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 15 }}>Delete Game</Text>
          </Pressable>
        </View>
      </ScrollView>
      {captureModal}
    </SafeAreaView>
  );
}
