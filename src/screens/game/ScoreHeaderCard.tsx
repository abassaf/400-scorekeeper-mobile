import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { runningTotals, playerCumulativeScore } from '../../scoring';
import { ScoreProgressBar } from '../../components/ScoreProgressBar';
import { colors } from '../../theme';
import type { GameState } from '../../types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onShare: () => void;
  onSave?: () => void;
}

export function ScoreHeaderCard({ state, onNewGame, onShare, onSave }: Props) {
  const { players, scoreLimit, rounds, phase } = state;
  const totals = runningTotals(rounds);

  const aBlocked =
    totals.a >= scoreLimit &&
    ([0, 1] as const).some((i) => playerCumulativeScore(rounds, i) < 0);
  const bBlocked =
    totals.b >= scoreLimit &&
    ([2, 3] as const).some((i) => playerCumulativeScore(rounds, i) < 0);

  const roundDisplay =
    phase === 'playing'
      ? `Round ${rounds.length + 1}`
      : `${rounds.length} Round${rounds.length !== 1 ? 's' : ''} Played`;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {(['A', 'B'] as const).map((team) => {
          const total = team === 'A' ? totals.a : totals.b;
          const p1 = team === 'A' ? players[0] : players[2];
          const p2 = team === 'A' ? players[1] : players[3];
          const blocked = team === 'A' ? aBlocked : bBlocked;
          const teamColors = team === 'A' ? colors.teamA : colors.teamB;
          return (
            <View key={team} style={{ flex: 1, backgroundColor: teamColors.bg, borderWidth: 1, borderColor: teamColors.border, borderRadius: 12, padding: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: teamColors.text, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Team {team}
                </Text>
                {blocked && (
                  <View style={{ backgroundColor: colors.dangerBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '600' }}>Blocked</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{p1} & {p2}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 36, fontWeight: '700', marginTop: 6 }}>{total}</Text>
              <View style={{ marginTop: 8 }}>
                <ScoreProgressBar value={total} limit={scoreLimit} fillColor={teamColors.solid} />
              </View>
              <Text style={{ color: colors.textSubtle, fontSize: 10, textAlign: 'right', marginTop: 2 }}>/ {scoreLimit}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{roundDisplay}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onShare}
            accessibilityLabel="Share game"
            accessibilityRole="button"
            style={{ backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Share</Text>
          </Pressable>
          {onSave != null && phase === 'playing' && rounds.length > 0 && (
            <Pressable
              onPress={onSave}
              accessibilityLabel="Save game to history"
              accessibilityRole="button"
              style={{ backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ color: colors.accent, fontSize: 12 }}>Save</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onNewGame}
            accessibilityLabel="Start new game"
            accessibilityRole="button"
            style={{ backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>New Game</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
