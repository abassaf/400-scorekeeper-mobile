import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { colors } from '../../theme';

export function SettingsScreen() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const webhookUrl: string = (Constants.expoConfig?.extra?.discordWebhookUrl as string) ?? '';
  const version = Constants.expoConfig?.version ?? 'unknown';
  const buildNumber =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber ?? ''
      : Constants.expoConfig?.android?.versionCode?.toString() ?? '';

  async function handleSend() {
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const platform = `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''} / ${Device.modelName ?? 'unknown'}`.trim();
      const versionLabel = buildNumber ? `${version} (build ${buildNumber})` : version;
      const body = {
        embeds: [{
          title: '400 Scorekeeper — App Feedback',
          color: 5793266,
          fields: [
            { name: 'Message', value: message.trim(), inline: false },
            { name: 'Email (optional)', value: email.trim() || 'None', inline: true },
            { name: 'App Version', value: versionLabel, inline: true },
            { name: 'Platform', value: platform, inline: true },
          ],
        }],
      };
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
            onChangeText={setMessage}
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
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
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
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 14 }}>
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
