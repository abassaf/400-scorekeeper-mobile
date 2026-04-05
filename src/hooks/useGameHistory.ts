import { useState, useEffect, useCallback } from 'react';
import { storage } from '../storage';
import type { GameState, Round } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  id: string;
  completedAt: number;
  players: [string, string, string, string];
  scoreLimit: number;
  rounds: Round[];
  winner: 'A' | 'B' | null;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export function buildHistoryEntry(state: GameState): HistoryEntry {
  if (state.phase === 'setup' || state.rounds.length === 0) {
    throw new Error('Cannot build history entry from a game with no rounds');
  }
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    completedAt: Date.now(),
    players: [...state.players] as [string, string, string, string],
    scoreLimit: state.scoreLimit,
    rounds: state.rounds,
    winner: state.winner,
  };
}

export function isValidHistoryEntry(val: unknown): val is HistoryEntry {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'completedAt' in val &&
    'players' in val &&
    'rounds' in val &&
    'winner' in val
  );
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const HISTORY_KEY = '400-scorekeeper-history';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameHistory(): {
  history: HistoryEntry[];
  saveGame: (state: GameState) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await storage.getItem(HISTORY_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter(isValidHistoryEntry));
        }
      } else {
        setHistory([]);
      }
    } catch {
      console.warn('Failed to load game history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async (entries: HistoryEntry[]) => {
    await storage.setItem(HISTORY_KEY, JSON.stringify(entries));
    setHistory(entries);
  }, []);

  const saveGame = useCallback(async (state: GameState) => {
    if (state.phase === 'setup' || state.rounds.length === 0) return;
    try {
      const entry = buildHistoryEntry(state);
      const next = [entry, ...history];
      await persist(next);
    } catch {
      console.warn('Failed to save game to history');
    }
  }, [history, persist]);

  const deleteGame = useCallback(async (id: string) => {
    try {
      const next = history.filter((e) => e.id !== id);
      await persist(next);
    } catch {
      console.warn('Failed to delete game from history');
    }
  }, [history, persist]);

  const clearAll = useCallback(async () => {
    try {
      await storage.removeItem(HISTORY_KEY);
      setHistory([]);
    } catch {
      console.warn('Failed to clear game history');
    }
  }, []);

  return { history, saveGame, deleteGame, clearAll, loading, reload: load };
}
