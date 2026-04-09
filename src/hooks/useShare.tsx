import React, { useState, useCallback, useRef } from 'react';
import { View, Alert, Share, Modal } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { stateToDeepLink } from './gameReducer';
import { ScoreSummaryCard } from '../components/ScoreSummaryCard';
import type { GameState } from '../types';

export function useShare(): {
  sharing: boolean;
  captureModal: React.ReactNode;
  shareImage: (state: GameState) => Promise<void>;
  shareLink: (state: GameState) => Promise<void>;
  showShareSheet: (state: GameState) => void;
} {
  const [sharing, setSharing] = useState(false);
  const [captureState, setCaptureState] = useState<GameState | null>(null);
  const cardRef = useRef<View>(null);
  const resolveCapture = useRef<((uri: string) => void) | null>(null);

  // Rendered by the host component — a transparent modal that keeps the card
  // in iOS's native render tree so captureRef can actually see it.
  const captureModal: React.ReactNode = captureState ? (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <View style={{ position: 'absolute', top: 0, left: 0, opacity: 0.01 }} pointerEvents="none">
        <ScoreSummaryCard ref={cardRef} state={captureState} />
      </View>
    </Modal>
  ) : null;

  const shareImage = useCallback(async (state: GameState) => {
    if (sharing) return;
    setSharing(true);
    try {
      // Show the modal with the card
      setCaptureState(state);

      // Wait two animation frames for the modal and card to finish layout
      const uri = await new Promise<string>((resolve, reject) => {
        resolveCapture.current = resolve;
        setTimeout(async () => {
          try {
            const captured = await captureRef(cardRef, {
              format: 'png',
              quality: 1,
              result: 'tmpfile',
            });
            resolve(captured);
          } catch (e) {
            reject(e);
          }
        }, 300);
      });

      setCaptureState(null);

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '400 Scorekeeper' });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing.');
      }
    } catch (e) {
      setCaptureState(null);
      console.warn('Share image failed', e);
      Alert.alert('Share failed', 'Could not generate image. Please try again.');
    } finally {
      setSharing(false);
      resolveCapture.current = null;
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
