import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import type { GameState, PlayerIndex } from '../types';
import { runningTotals, playerStats, playerCumulativeScore } from '../scoring';
import { colors } from '../theme';

interface ScoreSummaryCardProps {
  state: GameState;
}

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

function clampedPct(value: number, limit: number): string {
  if (limit <= 0) return '0%';
  return `${Math.min(Math.max((value / limit) * 100, 0), 100)}%`;
}

function scoreColor(score: number): string {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}

function formatDelta(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export const ScoreSummaryCard = forwardRef<View, ScoreSummaryCardProps>(
  ({ state }, ref) => {
    const { players, rounds, scoreLimit } = state;
    const totals = runningTotals(rounds);
    const stats = PLAYER_INDICES.map((i) => playerStats(rounds, i));

    let runA = 0;
    let runB = 0;
    const cumulatives = rounds.map((r) => {
      runA += r.teamAScore;
      runB += r.teamBScore;
      return { a: runA, b: runB };
    });

    const roundDisplay =
      state.phase === 'playing'
        ? `Round ${rounds.length + 1}`
        : `${rounds.length} Round${rounds.length !== 1 ? 's' : ''} Played`;

    return (
      <View ref={ref} style={{ width: 340, backgroundColor: colors.bg, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>
            400 Scorekeeper
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{roundDisplay}</Text>
        </View>

        {/* Team scores */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['A', 'B'] as const).map((team) => {
            const total = team === 'A' ? totals.a : totals.b;
            const p1 = team === 'A' ? players[0] : players[2];
            const p2 = team === 'A' ? players[1] : players[3];
            const isWinner = state.winner === team;
            return (
              <View
                key={team}
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isWinner ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Team {team}{isWinner ? ' 🏆' : ''}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {p1} & {p2}
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '700', marginTop: 4 }}>
                  {total}
                </Text>
                {/* Progress bar (static for capture) */}
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: 6, backgroundColor: colors.accent, borderRadius: 3, width: clampedPct(total, scoreLimit) as `${number}%` }} />
                </View>
                <Text style={{ color: colors.textSubtle, fontSize: 10, textAlign: 'right', marginTop: 2 }}>
                  / {scoreLimit}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Round history */}
        {rounds.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}>
            <Text style={{ color: colors.textSubtle, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Round History
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 20, color: colors.textSubtle, fontSize: 9 }}>#</Text>
              {PLAYER_INDICES.map((i) => (
                <Text key={i} style={{ flex: 1, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>
                  {players[i].split(' ')[0]}
                </Text>
              ))}
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>AΔ</Text>
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>BΔ</Text>
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>AΣ</Text>
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>BΣ</Text>
            </View>
            {rounds.map((round, idx) => {
              const cum = cumulatives[idx];
              return (
                <View key={round.id} style={{ flexDirection: 'row', paddingVertical: 3, backgroundColor: idx % 2 === 1 ? 'rgba(39,39,42,0.4)' : 'transparent' }}>
                  <Text style={{ width: 20, color: colors.textMuted, fontSize: 9 }}>{round.id}</Text>
                  {PLAYER_INDICES.map((i) => {
                    const e = round.entries[i];
                    const made = e.obtained >= e.called;
                    return (
                      <Text key={i} style={{ flex: 1, color: made ? colors.positive : colors.danger, fontSize: 9, textAlign: 'right' }}>
                        {e.called}→{e.obtained}
                      </Text>
                    );
                  })}
                  <Text style={{ width: 24, color: scoreColor(round.teamAScore), fontSize: 9, textAlign: 'right' }}>
                    {formatDelta(round.teamAScore)}
                  </Text>
                  <Text style={{ width: 24, color: scoreColor(round.teamBScore), fontSize: 9, textAlign: 'right' }}>
                    {formatDelta(round.teamBScore)}
                  </Text>
                  <Text style={{ width: 24, color: colors.textPrimary, fontSize: 9, fontWeight: '600', textAlign: 'right' }}>{cum.a}</Text>
                  <Text style={{ width: 24, color: colors.textPrimary, fontSize: 9, fontWeight: '600', textAlign: 'right' }}>{cum.b}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Player stats */}
        {rounds.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {PLAYER_INDICES.map((i) => {
              const s = stats[i];
              const score = playerCumulativeScore(rounds, i);
              const makeRateColor = s.makeRate >= 0.7 ? colors.positive : s.makeRate >= 0.5 ? colors.warn : colors.danger;
              return (
                <View key={i} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>{players[i]}</Text>
                  <Text style={{ color: colors.textSubtle, fontSize: 9, marginBottom: 4 }}>{i < 2 ? 'Team A' : 'Team B'}</Text>
                  <Text style={{ color: scoreColor(score), fontSize: 11, fontWeight: '700' }}>{score >= 0 ? '+' : ''}{score}</Text>
                  <Text style={{ color: makeRateColor, fontSize: 10, fontWeight: '600' }}>{Math.round(s.makeRate * 100)}%</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 9 }}>{s.avgCalled.toFixed(1)} bid</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <Text style={{ color: colors.textSubtle, fontSize: 10, textAlign: 'center', marginTop: 12 }}>
          400 Scorekeeper
        </Text>
      </View>
    );
  }
);

ScoreSummaryCard.displayName = 'ScoreSummaryCard';
