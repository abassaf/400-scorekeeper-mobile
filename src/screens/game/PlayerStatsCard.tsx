import React from 'react';
import { View, Text } from 'react-native';
import { playerStats, playerCumulativeScore, runningTotals } from '../../scoring';
import { colors } from '../../theme';
import type { GameState, PlayerIndex } from '../../types';

interface Props { state: GameState; }
const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];
function makeRateColor(r: number) { return r >= 0.7 ? colors.positive : r >= 0.5 ? colors.warn : colors.danger; }

export function PlayerStatsCard({ state }: Props) {
  const { rounds, players } = state;
  const totals = runningTotals(rounds);
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Player Stats</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {PLAYER_INDICES.map((idx) => {
          const s = playerStats(rounds, idx);
          const score = playerCumulativeScore(rounds, idx);
          return (
            <View key={idx} style={{ flex: 1, backgroundColor: 'rgba(39,39,42,0.5)', borderRadius: 10, padding: 10 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{players[idx]}</Text>
              <Text style={{ color: colors.textSubtle, fontSize: 10, marginBottom: 6 }}>{idx < 2 ? 'Team A' : 'Team B'}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Score</Text>
                <Text style={{ color: score >= 0 ? colors.positive : colors.danger, fontSize: 10, fontWeight: '600' }}>{score >= 0 ? '+' : ''}{score}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Make%</Text>
                <Text style={{ color: makeRateColor(s.makeRate), fontSize: 10, fontWeight: '600' }}>{Math.round(s.makeRate * 100)}%</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Avg bid</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{s.avgCalled.toFixed(1)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Avg won</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{s.avgObtained.toFixed(1)}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Team A: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{totals.a}</Text></Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Team B: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{totals.b}</Text></Text>
      </View>
    </View>
  );
}
