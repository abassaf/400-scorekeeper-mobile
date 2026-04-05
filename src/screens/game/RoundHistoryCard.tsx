import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors } from '../../theme';
import type { GameState, PlayerIndex } from '../../types';

interface Props { state: GameState; }
const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

function scoreColor(s: number) { return s > 0 ? colors.positive : s < 0 ? colors.danger : colors.textSecondary; }
function fmt(s: number) { return s > 0 ? `+${s}` : `${s}`; }

export function RoundHistoryCard({ state }: Props) {
  const { rounds, players } = state;
  if (rounds.length === 0) return null;

  let runA = 0, runB = 0;
  const cumulatives = rounds.map((r) => { runA += r.teamAScore; runB += r.teamBScore; return { a: runA, b: runB }; });
  const display = [...rounds.map((round, idx) => ({ round, cum: cumulatives[idx] }))].reverse();

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Round History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6, marginBottom: 4 }}>
            <Text style={{ width: 24, color: colors.textSubtle, fontSize: 10, fontWeight: '600' }}>#</Text>
            {players.map((name, i) => <Text key={i} style={{ width: 60, color: colors.textSubtle, fontSize: 10, fontWeight: '600', textAlign: 'right' }} numberOfLines={1}>{name.split(' ')[0]}</Text>)}
            {['AΔ','BΔ','AΣ','BΣ'].map((h) => <Text key={h} style={{ width: 36, color: colors.textSubtle, fontSize: 10, fontWeight: '600', textAlign: 'right' }}>{h}</Text>)}
          </View>
          {display.map(({ round, cum }, rowIdx) => (
            <View key={round.id} style={{ flexDirection: 'row', paddingVertical: 5, backgroundColor: rowIdx % 2 === 1 ? 'rgba(39,39,42,0.4)' : 'transparent' }}>
              <Text style={{ width: 24, fontSize: 11, color: colors.textMuted }}>{round.id}</Text>
              {PLAYER_INDICES.map((i) => { const e = round.entries[i]; const made = e.obtained >= e.called; return <Text key={i} style={{ width: 60, fontSize: 11, textAlign: 'right', color: made ? colors.positive : colors.danger }}>{e.called}→{e.obtained}</Text>; })}
              <Text style={{ width: 36, fontSize: 11, textAlign: 'right', color: scoreColor(round.teamAScore) }}>{fmt(round.teamAScore)}</Text>
              <Text style={{ width: 36, fontSize: 11, textAlign: 'right', color: scoreColor(round.teamBScore) }}>{fmt(round.teamBScore)}</Text>
              <Text style={{ width: 36, fontSize: 11, textAlign: 'right', color: colors.textPrimary, fontWeight: '600' }}>{cum.a}</Text>
              <Text style={{ width: 36, fontSize: 11, textAlign: 'right', color: colors.textPrimary, fontWeight: '600' }}>{cum.b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
