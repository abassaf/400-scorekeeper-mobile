import React from 'react';
import { View, Text } from 'react-native';
import { playerStats, playerCumulativeScore, runningTotals } from '../../scoring';
import { colors } from '../../theme';
import type { GameState, PlayerIndex } from '../../types';

interface Props { state: GameState; }
function makeRateColor(r: number) { return r >= 0.7 ? colors.positive : r >= 0.5 ? colors.warn : colors.danger; }

export function PlayerStatsCard({ state }: Props) {
  const { rounds, players } = state;
  const totals = runningTotals(rounds);
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Player Stats</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {([0, 2] as const).map((colStart) => (
          <View key={colStart} style={{ flex: 1, gap: 8 }}>
            {([colStart, colStart + 1] as PlayerIndex[]).map((idx) => {
              const s = playerStats(rounds, idx);
              const score = playerCumulativeScore(rounds, idx);
              const isTeamA = idx < 2;
              const teamColors = isTeamA ? colors.teamA : colors.teamB;
              return (
                <View key={idx} style={{ backgroundColor: teamColors.bg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: teamColors.border }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{players[idx]}</Text>
                  <Text style={{ color: teamColors.text, fontSize: 11, marginBottom: 6 }}>{isTeamA ? 'Team A' : 'Team B'}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>Score</Text>
                    <Text style={{ color: score >= 0 ? colors.positive : colors.danger, fontSize: 11, fontWeight: '600' }}>{score >= 0 ? '+' : ''}{score}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>Make%</Text>
                    <Text style={{ color: makeRateColor(s.makeRate), fontSize: 11, fontWeight: '600' }}>{Math.round(s.makeRate * 100)}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>Avg bid</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{s.avgCalled.toFixed(1)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>Avg won</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{s.avgObtained.toFixed(1)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ color: colors.teamA.text, fontSize: 13 }}>Team A: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{totals.a}</Text></Text>
        <Text style={{ color: colors.teamB.text, fontSize: 13 }}>Team B: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{totals.b}</Text></Text>
      </View>
    </View>
  );
}
