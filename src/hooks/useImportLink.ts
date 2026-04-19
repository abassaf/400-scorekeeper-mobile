import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { deepLinkToState } from './gameReducer';
import type { GameState } from '../types';
import type { GameAction } from './gameReducer';

const SCHEME = 'fourhundredscorekeeper://';

interface UseImportLinkOptions {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  saveGame: (state: GameState) => Promise<string | undefined>;
}

export interface UseImportLinkResult {
  linkText: string;
  setLinkText: (text: string) => void;
  handleImport: () => void;
}

export function useImportLink({ state, dispatch, saveGame }: UseImportLinkOptions): UseImportLinkResult {
  const [linkText, setLinkText] = useState('');

  // Auto-detect a valid game link in the clipboard on mount
  useEffect(() => {
    Clipboard.getStringAsync().then((text) => {
      if (text && text.startsWith(SCHEME) && deepLinkToState(text) !== null) {
        setLinkText(text);
      }
    }).catch(() => undefined);
  }, []);

  const doLoad = useCallback((imported: GameState) => {
    dispatch({ type: 'LOAD_STATE', state: imported });
  }, [dispatch]);

  const handleImport = useCallback(() => {
    const imported = deepLinkToState(linkText.trim());
    if (!imported) {
      Alert.alert('Invalid link', 'This does not appear to be a valid 400 Scorekeeper game link.');
      return;
    }

    const hasActiveGame = state.phase === 'playing' && state.rounds.length > 0;
    if (!hasActiveGame) {
      doLoad(imported);
      setLinkText('');
      return;
    }

    // Conflict: a game is in progress
    Alert.alert(
      'Game in Progress',
      'You have an active game. What would you like to do?',
      [
        {
          text: 'Save & Replace',
          onPress: async () => {
            await saveGame(state);
            doLoad(imported);
            setLinkText('');
          },
        },
        {
          text: 'Replace Without Saving',
          style: 'destructive',
          onPress: () => {
            doLoad(imported);
            setLinkText('');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [linkText, state, doLoad, saveGame]);

  return { linkText, setLinkText, handleImport };
}
