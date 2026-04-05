import { gameReducer, initialState, isValidState } from '../src/hooks/gameReducer';
import type { GameAction } from '../src/hooks/gameReducer';
import type { PlayerEntry } from '../src/types';

const entries4: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry] = [
  { called: 5, obtained: 5 },
  { called: 3, obtained: 3 },
  { called: 2, obtained: 2 },
  { called: 3, obtained: 3 },
];

describe('gameReducer', () => {
  describe('START_GAME', () => {
    it('transitions to playing phase', () => {
      const action: GameAction = {
        type: 'START_GAME',
        players: ['Alice', 'Bob', 'Carol', 'Dave'],
        scoreLimit: 80,
      };
      const next = gameReducer(initialState, action);
      expect(next.phase).toBe('playing');
      expect(next.players).toEqual(['Alice', 'Bob', 'Carol', 'Dave']);
      expect(next.scoreLimit).toBe(80);
      expect(next.rounds).toHaveLength(0);
    });

    it('clamps scoreLimit to 40 minimum', () => {
      const action: GameAction = { type: 'START_GAME', players: ['A', 'B', 'C', 'D'], scoreLimit: 10 };
      expect(gameReducer(initialState, action).scoreLimit).toBe(40);
    });
  });

  describe('ADD_ROUND', () => {
    it('adds a round and calculates scores', () => {
      const playing = gameReducer(initialState, { type: 'START_GAME', players: ['A', 'B', 'C', 'D'], scoreLimit: 80 });
      const next = gameReducer(playing, { type: 'ADD_ROUND', entries: entries4 });
      expect(next.rounds).toHaveLength(1);
      expect(next.rounds[0].teamAScore).toBe(13); // playerScore(5,5)=10 + playerScore(3,3)=3
      expect(next.rounds[0].teamBScore).toBe(5);  // playerScore(2,2)=2 + playerScore(3,3)=3
    });
  });

  describe('UNDO_ROUND', () => {
    it('removes the last round', () => {
      const playing = gameReducer(initialState, { type: 'START_GAME', players: ['A', 'B', 'C', 'D'], scoreLimit: 80 });
      const withRound = gameReducer(playing, { type: 'ADD_ROUND', entries: entries4 });
      const undone = gameReducer(withRound, { type: 'UNDO_ROUND' });
      expect(undone.rounds).toHaveLength(0);
    });

    it('is a no-op with no rounds', () => {
      const playing = gameReducer(initialState, { type: 'START_GAME', players: ['A', 'B', 'C', 'D'], scoreLimit: 80 });
      expect(gameReducer(playing, { type: 'UNDO_ROUND' })).toBe(playing);
    });
  });

  describe('win detection', () => {
    it('detects winner when team reaches scoreLimit and all players non-negative', () => {
      const playing = gameReducer(initialState, {
        type: 'START_GAME',
        players: ['A', 'B', 'C', 'D'],
        scoreLimit: 40,
      });
      const bigEntries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry] = [
        { called: 9, obtained: 9 },  // 27
        { called: 9, obtained: 9 },  // 27
        { called: 1, obtained: 0 },  // -1
        { called: 1, obtained: 0 },  // -1
      ];
      const state1 = gameReducer(playing, { type: 'ADD_ROUND', entries: bigEntries });
      expect(state1.phase).toBe('finished');
      expect(state1.winner).toBe('A');
    });
  });

  describe('isValidState', () => {
    it('returns true for valid GameState shape', () => {
      expect(isValidState({ phase: 'setup', players: [], rounds: [] })).toBe(true);
    });

    it('returns false for non-objects', () => {
      expect(isValidState(null)).toBe(false);
      expect(isValidState('string')).toBe(false);
      expect(isValidState(42)).toBe(false);
    });
  });
});
