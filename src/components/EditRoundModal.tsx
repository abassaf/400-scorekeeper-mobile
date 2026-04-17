import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable } from 'react-native';
import { colors } from '../theme';
import { NumberStepper } from './NumberStepper';
import type { Round, PlayerEntry } from '../types';

interface Props {
  visible: boolean;
  round: Round | null;
  players: [string, string, string, string];
  onSave: (roundId: number, entries: Round['entries'], comment: string) => void;
  onClose: () => void;
}

type Entries = [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry];

export function EditRoundModal({ visible, round, players, onSave, onClose }: Props) {
  const [entries, setEntries] = useState<Entries>([
    { called: 2, obtained: 0 },
    { called: 2, obtained: 0 },
    { called: 2, obtained: 0 },
    { called: 2, obtained: 0 },
  ]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (round && visible) {
      setEntries([
        { ...round.entries[0] },
        { ...round.entries[1] },
        { ...round.entries[2] },
        { ...round.entries[3] },
      ]);
      setComment(round.comment ?? '');
    }
  }, [round, visible]);

  if (!round) return null;

  function updateEntry(index: 0 | 1 | 2 | 3, field: keyof PlayerEntry, value: number) {
    const next: Entries = [{ ...entries[0] }, { ...entries[1] }, { ...entries[2] }, { ...entries[3] }];
    next[index] = { ...next[index], [field]: value };
    setEntries(next);
  }

  const calledSum = entries[0].called + entries[1].called + entries[2].called + entries[3].called;
  const obtainedSum = entries[0].obtained + entries[1].obtained + entries[2].obtained + entries[3].obtained;
  const canSubmit = calledSum >= 11 && obtainedSum <= 13;

  const validationColor = calledSum < 11 ? colors.danger : obtainedSum > 13 ? colors.danger : colors.positive;
  const validationText = calledSum < 11
    ? `Bids too low: ${calledSum} (min 11)`
    : obtainedSum > 13
    ? `Tricks too high: ${obtainedSum} (max 13)`
    : `Bids: ${calledSum} · Tricks: ${obtainedSum}`;

  function handleSave() {
    if (!round || !canSubmit) return;
    onSave(round.id, entries, comment);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Edit Round {round.id}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, textAlign: 'center' }}>Team A</Text>
              {([0, 1] as const).map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>{players[i]}</Text>
                  <NumberStepper value={entries[i].called} min={2} max={13} onChange={(v) => updateEntry(i, 'called', v)} label="Bid" />
                  <View style={{ height: 8 }} />
                  <NumberStepper value={entries[i].obtained} min={0} max={13} onChange={(v) => updateEntry(i, 'obtained', v)} label="Tricks" />
                </View>
              ))}
            </View>

            <View style={{ width: 1, backgroundColor: colors.border }} />

            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, textAlign: 'center' }}>Team B</Text>
              {([2, 3] as const).map((i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>{players[i]}</Text>
                  <NumberStepper value={entries[i].called} min={2} max={13} onChange={(v) => updateEntry(i, 'called', v)} label="Bid" />
                  <View style={{ height: 8 }} />
                  <NumberStepper value={entries[i].obtained} min={0} max={13} onChange={(v) => updateEntry(i, 'obtained', v)} label="Tricks" />
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: validationColor, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{validationText}</Text>
          </View>

          <TextInput
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, 200))}
            placeholder="Add a note for this round…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.textPrimary,
              fontSize: 14,
              minHeight: 60,
              marginBottom: 16,
            }}
          />

          <Pressable
            onPress={handleSave}
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? colors.buttonPrimary : colors.borderMuted,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: canSubmit ? colors.buttonPrimaryText : colors.textMuted, fontSize: 15, fontWeight: '700' }}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
