import React, { useState, useCallback } from 'react';
import { Alert, Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { stateToDeepLink } from './gameReducer';
import { generateShareImage } from '../utils/generateShareImage';
import { colors } from '../theme';
import type { GameState } from '../types';

export function useShare(): {
  sharing: boolean;
  captureModal: React.ReactNode;
  shareImage: (state: GameState) => Promise<void>;
  shareLink: (state: GameState) => Promise<void>;
  showShareSheet: (state: GameState) => void;
} {
  const [sharing, setSharing] = useState(false);
  const captureModal: React.ReactNode = null;

  const shareImage = useCallback(async (state: GameState) => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await generateShareImage(state, colors);

      if (Platform.OS === 'ios') {
        await Share.share({ url: uri });
      } else {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: '400 Scorekeeper',
            UTI: 'public.png',
          });
        } else {
          Alert.alert('Sharing not available', 'Your device does not support sharing.');
        }
      }
    } catch (e) {
      console.warn('Share image failed', e);
      Alert.alert('Share failed', 'Could not generate image. Please try again.');
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  const shareLink = useCallback(async (state: GameState) => {
    const url = stateToDeepLink(state);
    try {
      await Share.share({ message: url, url });
    } catch (e) {
      console.warn('Share link failed', e);
    }
  }, []);

  const showShareSheet = useCallback((state: GameState) => {
    Alert.alert('Share', 'How would you like to share?', [
      { text: 'Share as Image', onPress: () => shareImage(state) },
      { text: 'Share Link', onPress: () => shareLink(state) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [shareImage, shareLink]);

  return { sharing, captureModal, shareImage, shareLink, showShareSheet };
}
