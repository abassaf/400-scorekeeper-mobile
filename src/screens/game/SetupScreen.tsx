import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const DEFAULTS: [string, string, string, string] = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export function SetupScreen({ dispatch }: Props) {
  const { colors } = useTheme();
  const [names, setNames] = useState<[string, string, string, string]>(['', '', '', '']);
  const [scoreLimitRaw, setScoreLimitRaw] = useState('80');

  const scoreLimit = parseInt(scoreLimitRaw, 10);
  const scoreLimitInvalid = isNaN(scoreLimit) || scoreLimit < 40;

  function updateName(index: 0 | 1 | 2 | 3, value: string) {
    const next = [...names] as [string, string, string, string];
    next[index] = value;
    setNames(next);
  }

  async function handleStart() {
    if (scoreLimitInvalid) return;
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* ignore */ }
    }
    const resolved = names.map((n, i) => n.trim() || DEFAULTS[i]) as [string, string, string, string];
    dispatch({ type: 'START_GAME', players: resolved, scoreLimit });
  }

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 15,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '700' }}>
              400 Scorekeeper
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Set up your game</Text>
          </View>

          {/* Teams */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {(['A', 'B'] as const).map((team) => {
              const indices = team === 'A' ? ([0, 1] as const) : ([2, 3] as const);
              return (
                <View key={team} style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    Team {team}
                  </Text>
                  {indices.map((i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                        Player {i + 1}
                      </Text>
                      <TextInput
                        style={inputStyle}
                        value={names[i]}
                        onChangeText={(v) => updateName(i, v)}
                        placeholder={DEFAULTS[i]}
                        placeholderTextColor={colors.textSubtle}
                        textContentType="name"
                        autoCapitalize="words"
                        returnKeyType="next"
                        accessibilityLabel={`Player ${i + 1} name, Team ${team}`}
                      />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>

          {/* Score limit */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Score Limit</Text>
            <TextInput
              style={[inputStyle, { width: 120, borderColor: scoreLimitInvalid ? colors.danger : colors.borderMuted }]}
              value={scoreLimitRaw}
              onChangeText={setScoreLimitRaw}
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel="Score limit"
            />
            {scoreLimitInvalid ? (
              <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>Must be 40 or higher</Text>
            ) : (
              <Text style={{ color: colors.textSubtle, fontSize: 12, marginTop: 4 }}>
                First team to reach this score wins
              </Text>
            )}
          </View>

          {/* Start button */}
          <Pressable
            onPress={handleStart}
            disabled={scoreLimitInvalid}
            accessibilityLabel="Start game"
            accessibilityRole="button"
            style={{
              backgroundColor: scoreLimitInvalid ? colors.borderMuted : colors.buttonPrimary,
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              opacity: scoreLimitInvalid ? 0.5 : 1,
            }}
          >
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700', fontSize: 16 }}>
              Start Game
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
