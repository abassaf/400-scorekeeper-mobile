import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameHistory, type HistoryEntry } from '../../hooks/useGameHistory';
import { runningTotals } from '../../scoring';
import { SupportButton } from '../../components/SupportButton';
import { colors } from '../../theme';
import type { HistoryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function HistoryItem({ entry, onPress, onLongPress }: { entry: HistoryEntry; onPress: () => void; onLongPress: () => void }) {
  const totals = runningTotals(entry.rounds);
  const label = `Team ${entry.winner} won, ${totals.a} to ${totals.b}, played ${formatDate(entry.completedAt)}`;
  const winnerNames = entry.winner === 'A' ? `${entry.players[0]} & ${entry.players[1]}` : `${entry.players[2]} & ${entry.players[3]}`;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityLabel={label} accessibilityRole="button"
      style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>Team {entry.winner} Wins</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{winnerNames}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(entry.completedAt)}</Text>
          <Text style={{ color: colors.textSubtle, fontSize: 11, marginTop: 2 }}>{entry.rounds.length} rounds</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Team A: <Text style={{ color: entry.winner === 'A' ? colors.positive : colors.textPrimary, fontWeight: '600' }}>{totals.a}</Text></Text>
        <Text style={{ color: colors.textSubtle }}>·</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Team B: <Text style={{ color: entry.winner === 'B' ? colors.positive : colors.textPrimary, fontWeight: '600' }}>{totals.b}</Text></Text>
      </View>
    </Pressable>
  );
}

export function HistoryListScreen() {
  const navigation = useNavigation<Nav>();
  const { history, deleteGame, clearAll, loading } = useGameHistory();
  const [refreshing, setRefreshing] = useState(false);

  function handleLongPress(entry: HistoryEntry) {
    Alert.alert('Delete Game', 'Remove this game from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGame(entry.id) },
    ]);
  }

  function handleClearAll() {
    Alert.alert('Clear All History', 'Remove all saved games? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearAll },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>History</Text>
        {history.length > 0 && (
          <Pressable onPress={handleClearAll} accessibilityLabel="Clear all history" accessibilityRole="button">
            <Text style={{ color: colors.danger, fontSize: 13 }}>Clear All</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 400); }} tintColor={colors.accent} />}
        ListEmptyComponent={!loading ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ color: colors.textMuted, fontSize: 15 }}>No games yet.</Text>
            <Text style={{ color: colors.textSubtle, fontSize: 13, marginTop: 4 }}>Start a game on the Game tab.</Text>
          </View>
        ) : null}
        ListFooterComponent={history.length > 0 ? <SupportButton /> : null}
        renderItem={({ item }) => (
          <HistoryItem entry={item} onPress={() => navigation.navigate('HistoryDetail', { entry: item })} onLongPress={() => handleLongPress(item)} />
        )}
      />
    </SafeAreaView>
  );
}
