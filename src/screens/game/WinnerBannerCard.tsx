import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { runningTotals } from '../../scoring';
import { colors } from '../../theme';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';

interface Props { state: GameState; dispatch: React.Dispatch<GameAction>; onShare: () => void; }

export function WinnerBannerCard({ state, dispatch, onShare }: Props) {
  if (state.phase !== 'finished' || state.winner === null) return null;
  const totals = runningTotals(state.rounds);
  const { winner, players } = state;
  const winningTeamNames = winner === 'A' ? `${players[0]} & ${players[1]}` : `${players[2]} & ${players[3]}`;

  async function handleNewGame() {
    if (Platform.OS !== 'web') { try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* ignore */ } }
    dispatch({ type: 'NEW_GAME' });
  }

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, borderTopColor: colors.accent }}>
      <Ionicons name="trophy" size={32} color={colors.accent} style={{ marginBottom: 10 }} />
      <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700' }}>Team {winner} Wins!</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{winningTeamNames}</Text>
      <Text style={{ marginTop: 10, fontSize: 13 }}>
        <Text style={{ color: winner === 'A' ? colors.positive : colors.textMuted, fontWeight: winner === 'A' ? '700' : '400' }}>Team A: {totals.a} pts</Text>
        <Text style={{ color: colors.textSubtle }}>  ·  </Text>
        <Text style={{ color: winner === 'B' ? colors.positive : colors.textMuted, fontWeight: winner === 'B' ? '700' : '400' }}>Team B: {totals.b} pts</Text>
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Pressable onPress={handleNewGame} accessibilityLabel="Start a new game" accessibilityRole="button" style={{ flex: 1, backgroundColor: colors.buttonPrimary, borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700' }}>New Game</Text>
        </Pressable>
        <Pressable onPress={() => dispatch({ type: 'KEEP_PLAYING' })} accessibilityLabel="Keep playing" accessibilityRole="button" style={{ flex: 1, backgroundColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Keep Playing</Text>
        </Pressable>
        <Pressable onPress={onShare} accessibilityLabel="Share game result" accessibilityRole="button" style={{ backgroundColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
