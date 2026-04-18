import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useTheme } from '../../context/ThemeContext';
import { ThemePicker } from '../../components/ThemePicker';

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function SettingsScreen() {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const feedbackEndpoint = (Constants.expoConfig?.extra?.feedbackEndpoint as string | undefined) ?? '';
  const version = Constants.expoConfig?.version ?? 'unknown';
  const buildNumber =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber ?? ''
      : Constants.expoConfig?.android?.versionCode?.toString() ?? '';

  async function handleSend() {
    if (!message.trim() || status === 'sending' || !feedbackEndpoint) return;
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError('');
    setStatus('sending');
    try {
      const platform = `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''} / ${Device.modelName ?? 'unknown'}`.trim();
      const versionLabel = buildNumber ? `${version} (build ${buildNumber})` : version;
      const res = await fetch(feedbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || 'None',
          version: versionLabel,
          platform,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      setMessage('');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 20 }}>Settings</Text>

        {/* Appearance card */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Appearance
          </Text>
          <ThemePicker />
        </View>

        {feedbackEndpoint ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Send Feedback</Text>
          <TextInput
            style={{
              backgroundColor: colors.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.textPrimary,
              padding: 12,
              fontSize: 14,
              minHeight: 100,
              textAlignVertical: 'top',
              marginBottom: 10,
            }}
            multiline
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={(t) => { setMessage(t); if (status !== 'idle') setStatus('idle'); }}
            maxLength={1000}
          />
          <TextInput
            style={{
              backgroundColor: colors.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.textPrimary,
              padding: 12,
              fontSize: 14,
              marginBottom: 12,
            }}
            placeholder="Email (optional)"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(''); if (status !== 'idle') setStatus('idle'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={254}
          />
          {emailError ? (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 8 }}>{emailError}</Text>
          ) : null}
          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || status === 'sending'}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: !message.trim() || status === 'sending' ? 0.45 : 1,
            }}
          >
            <Text style={{ color: colors.accentText, fontWeight: '700', fontSize: 14 }}>
              {status === 'sending' ? 'Sending…' : 'Send Feedback'}
            </Text>
          </Pressable>
          {status === 'success' && (
            <Text style={{ color: colors.positive, fontSize: 13, marginTop: 10, textAlign: 'center' }}>Feedback sent — thank you!</Text>
          )}
          {status === 'error' && (
            <Text style={{ color: colors.danger, fontSize: 13, marginTop: 10, textAlign: 'center' }}>Failed to send — check your connection</Text>
          )}
        </View>
        ) : null}

        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>About</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            400 Scorekeeper · v{version}{buildNumber ? ` (${buildNumber})` : ''}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
