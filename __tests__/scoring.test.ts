import { playerScore, calcRound, runningTotals, playerStats, playerCumulativeScore } from '../src/scoring';
import type { Round } from '../src/types';

describe('playerScore', () => {
  it('returns table value when obtained >= called', () => {
    expect(playerScore(5, 5)).toBe(10);
    expect(playerScore(9, 13)).toBe(27);
    expect(playerScore(13, 13)).toBe(52);
  });

  it('returns negative called when obtained < called', () => {
    expect(playerScore(5, 4)).toBe(-5);
    expect(playerScore(9, 0)).toBe(-9);
  });

  it('handles called=1', () => {
    expect(playerScore(1, 1)).toBe(1);
    expect(playerScore(1, 0)).toBe(-1);
  });
});

describe('calcRound', () => {
  it('sums team scores correctly', () => {
    const entries: Parameters<typeof calcRound>[0] = [
      { called: 5, obtained: 5 },
      { called: 3, obtained: 3 },
      { called: 2, obtained: 2 },
      { called: 1, obtained: 0 },
    ];
    const result = calcRound(entries);
    expect(result.teamAScore).toBe(13);
    expect(result.teamBScore).toBe(1);
  });
});

describe('runningTotals', () => {
  it('returns zeros for empty rounds', () => {
    expect(runningTotals([])).toEqual({ a: 0, b: 0 });
  });

  it('accumulates correctly', () => {
    const rounds: Round[] = [
      { id: 1, entries: [{ called: 5, obtained: 5 }, { called: 5, obtained: 5 }, { called: 2, obtained: 2 }, { called: 1, obtained: 0 }], teamAScore: 20, teamBScore: 1 },
      { id: 2, entries: [{ called: 3, obtained: 3 }, { called: 2, obtained: 2 }, { called: 4, obtained: 4 }, { called: 3, obtained: 3 }], teamAScore: 5, teamBScore: 7 },
    ];
    expect(runningTotals(rounds)).toEqual({ a: 25, b: 8 });
  });
});

describe('playerStats', () => {
  it('returns zeros for empty rounds', () => {
    expect(playerStats([], 0)).toEqual({ makeRate: 0, avgCalled: 0, avgObtained: 0 });
  });
});
