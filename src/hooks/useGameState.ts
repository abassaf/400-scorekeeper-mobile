import { useReducer, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { storage } from '../storage';
import { isValidState, gameReducer, initialState, stateToDeepLink } from './gameReducer';
import type { GameState } from '../types';

export { gameReducer, initialState, isValidState, stateToDeepLink };
export type { GameAction } from './gameReducer';

const GAME_STATE_KEY = '400-scorekeeper-state';

export function useGameState(): { state: GameState; dispatch: React.Dispatch<import('./gameReducer').GameAction> } {
  const [state, dispatch] = useReducer(gameReducer, undefined, (): GameState => initialState);
  const initialized = useRef(false);

  // Hydrate from storage on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const raw = await storage.getItem(GAME_STATE_KEY);
        if (raw !== null) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidState(parsed)) {
            dispatch({ type: 'LOAD_STATE', state: parsed });
          }
        }
      } catch {
        // Ignore read errors
      } finally {
        initialized.current = true;
      }
    }
    hydrate();
  }, []);

  // Persist on every state change (after initial hydration)
  useEffect(() => {
    if (!initialized.current) return;
    storage.setItem(GAME_STATE_KEY, JSON.stringify(state)).catch(() => {
      console.warn('Failed to persist game state');
    });
  }, [state]);

  // Deep link handling
  useEffect(() => {
    function handleUrl(url: string) {
      try {
        const match = url.match(/[?&]state=([^&]*)/);
        if (!match) return;
        const decoded: unknown = JSON.parse(atob(decodeURIComponent(match[1])));
        if (isValidState(decoded)) {
          dispatch({ type: 'LOAD_STATE', state: decoded });
        }
      } catch {
        // Ignore malformed deep links
      }
    }

    // Cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    }).catch(() => undefined);

    // Warm start
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return { state, dispatch };
}
