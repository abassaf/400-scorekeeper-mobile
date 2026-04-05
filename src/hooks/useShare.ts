import { useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { stateToDeepLink } from './gameReducer';
import type { GameState } from '../types';

export function useShare(cardRef: React.RefObject<View | null>): {
  sharing: boolean;
  shareImage: () => Promise<void>;
  shareLink: (state: GameState) => Promise<void>;
  showShareSheet: (state: GameState) => void;
} {
  const [sharing, setSharing] = useState(false);

  const shareImage = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '400 Scorekeeper' });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing.');
      }
    } catch (e) {
      console.warn('Share image failed', e);
    } finally {
      setSharing(false);
    }
  }, [cardRef, sharing]);

  const shareLink = useCallback(async (state: GameState) => {
    const url = stateToDeepLink(state);
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(url, { dialogTitle: '400 Scorekeeper' });
      } else {
        Alert.alert('Share Link', url);
      }
    } catch (e) {
      console.warn('Share link failed', e);
    }
  }, []);

  const showShareSheet = useCallback((state: GameState) => {
    Alert.alert('Share', 'How would you like to share?', [
      { text: 'Share as Image', onPress: shareImage },
      { text: 'Share Link', onPress: () => shareLink(state) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [shareImage, shareLink]);

  return { sharing, shareImage, shareLink, showShareSheet };
}
