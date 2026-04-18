import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NumberStepper } from '../../components/NumberStepper';
import { useTheme } from '../../context/ThemeContext';
import type { PlayerEntry, PlayerIndex } from '../../types';

interface Props {
  players: [string, string, string, string];
  roundsPlayed: number;
  onSubmit: (entries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry]) => void;
  onUndo: () => void;
}

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];
type FormState = [{ called: number; obtained: number }, { called: number; obtained: number }, { called: number; obtained: number }, { called: number; obtained: number }];

function emptyForm(): FormState {
  return [{ called: 2, obtained: 0 }, { called: 2, obtained: 0 }, { called: 2, obtained: 0 }, { called: 2, obtained: 0 }];
}

export function RoundFormCard({ players, roundsPlayed, onSubmit, onUndo }: Props) {
  const { colors } = useTheme();
  const [fields, setFields] = useState<FormState>(emptyForm);

  function update(index: PlayerIndex, key: 'called' | 'obtained', value: number) {
    const next = [...fields] as FormState;
    next[index] = { ...next[index], [key]: value };
    setFields(next);
  }

  const obtainedSum = PLAYER_INDICES.reduce<number>((sum, i) => sum + fields[i].obtained, 0);
  const calledSum = PLAYER_INDICES.reduce<number>((sum, i) => sum + fields[i].called, 0);
  const obtainedColor = obtainedSum === 13 ? colors.positive : obtainedSum > 13 ? colors.warn : colors.textMuted;
  const calledColor = calledSum >= 11 ? colors.positive : colors.warn;
  const canSubmit = calledSum >= 11 && obtainedSum <= 13;

  async function handleSubmit() {
    if (!canSubmit) return;
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* ignore */ }
    }
    onSubmit(fields.map((f) => ({ called: f.called, obtained: f.obtained })) as [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry]);
    setFields(emptyForm());
  }

  async function handleUndo() {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* ignore */ }
    }
    onUndo();
  }

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Round Entry</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {(['A', 'B'] as const).map((team) => {
          const indices = team === 'A' ? ([0, 1] as const) : ([2, 3] as const);
          const teamColors = team === 'A' ? colors.teamA : colors.teamB;
          return (
            <View key={team} style={{ flex: 1, gap: 16, backgroundColor: teamColors.bg, borderRadius: 10, padding: 8 }}>
              <Text style={{ color: teamColors.text, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Team {team}</Text>
              {indices.map((i) => (
                <View key={i} style={{ gap: 8 }}>
                  <NumberStepper value={fields[i].called} min={2} max={13} onChange={(v) => update(i, 'called', v)} label={players[i]} sublabel="Called" />
                  <NumberStepper value={fields[i].obtained} min={0} max={13} onChange={(v) => update(i, 'obtained', v)} sublabel="Obtained" />
                </View>
              ))}
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 16, gap: 4 }}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={{ color: calledColor, fontSize: 12 }}>Bids: {calledSum} {calledSum < 11 ? `(min 11)` : '✓'}</Text>
          <Text style={{ color: obtainedColor, fontSize: 12 }}>Obtained: {obtainedSum} / 13</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          {roundsPlayed > 0 && (
            <Pressable onPress={handleUndo} accessibilityLabel="Undo last round" accessibilityRole="button" style={{ backgroundColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Undo</Text>
            </Pressable>
          )}
          <Pressable onPress={handleSubmit} disabled={!canSubmit} accessibilityLabel="Add round" accessibilityRole="button" style={{ backgroundColor: colors.buttonPrimary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, opacity: canSubmit ? 1 : 0.4 }}>
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700', fontSize: 13 }}>Add Round</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
