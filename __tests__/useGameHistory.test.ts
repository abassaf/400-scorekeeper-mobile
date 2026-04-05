import { buildHistoryEntry, isValidHistoryEntry } from '../src/hooks/useGameHistory';
import type { GameState } from '../src/types';

const completedState: GameState = {
  phase: 'finished',
  players: ['Alice', 'Bob', 'Carol', 'Dave'],
  scoreLimit: 80,
  rounds: [
    {
      id: 1,
      entries: [
        { called: 5, obtained: 5 },
        { called: 3, obtained: 3 },
        { called: 2, obtained: 2 },
        { called: 3, obtained: 3 },
      ],
      teamAScore: 13,
      teamBScore: 5,
    },
  ],
  winner: 'A',
};

describe('buildHistoryEntry', () => {
  it('creates a HistoryEntry from a finished GameState', () => {
    const entry = buildHistoryEntry(completedState);
    expect(entry.winner).toBe('A');
    expect(entry.players).toEqual(['Alice', 'Bob', 'Carol', 'Dave']);
    expect(entry.rounds).toHaveLength(1);
    expect(typeof entry.id).toBe('string');
    expect(typeof entry.completedAt).toBe('number');
  });

  it('throws for non-finished state', () => {
    const setupState: GameState = { ...completedState, phase: 'setup', winner: null };
    expect(() => buildHistoryEntry(setupState)).toThrow();
  });
});

describe('isValidHistoryEntry', () => {
  it('returns true for a valid entry', () => {
    const entry = buildHistoryEntry(completedState);
    expect(isValidHistoryEntry(entry)).toBe(true);
  });

  it('returns false for invalid data', () => {
    expect(isValidHistoryEntry(null)).toBe(false);
    expect(isValidHistoryEntry({ id: 'x' })).toBe(false);
  });
});
