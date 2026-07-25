import { playerScore, calcRound, runningTotals, playerStats, playerCumulativeScore } from './scoring';
import type { Round } from './types';

describe('playerScore', () => {
  it('returns table value when obtained >= called', () => {
    expect(playerScore(5, 5, false)).toBe(10);
    expect(playerScore(9, 13, false)).toBe(27);
    expect(playerScore(13, 13, false)).toBe(52);
  });

  it('making the bid is unaffected by harshDoubles', () => {
    expect(playerScore(5, 5, true)).toBe(10);
    expect(playerScore(9, 13, true)).toBe(27);
    expect(playerScore(13, 13, true)).toBe(52);
  });

  it('returns negative called when obtained < called (default rule)', () => {
    expect(playerScore(5, 4, false)).toBe(-5);
    expect(playerScore(9, 0, false)).toBe(-9);
    expect(playerScore(13, 0, false)).toBe(-13);
  });

  it('returns negative table value when obtained < called (harsh doubles)', () => {
    expect(playerScore(5, 4, true)).toBe(-10);
    expect(playerScore(9, 0, true)).toBe(-27);
    expect(playerScore(13, 0, true)).toBe(-52);
  });

  it('is identical under both rules for bids below 5', () => {
    for (const called of [1, 2, 3, 4]) {
      expect(playerScore(called, 0, true)).toBe(playerScore(called, 0, false));
    }
  });

  it('handles called=1', () => {
    expect(playerScore(1, 1, false)).toBe(1);
    expect(playerScore(1, 0, false)).toBe(-1);
  });
});

describe('calcRound', () => {
  const entries: Parameters<typeof calcRound>[0] = [
    { called: 5, obtained: 5 },
    { called: 3, obtained: 3 },
    { called: 2, obtained: 2 },
    { called: 1, obtained: 0 },
  ];

  it('sums team scores correctly', () => {
    const result = calcRound(entries, false);
    expect(result.teamAScore).toBe(13);
    expect(result.teamBScore).toBe(1);
  });

  it('applies harshDoubles to missed bids only', () => {
    const missed: Parameters<typeof calcRound>[0] = [
      { called: 5, obtained: 4 },
      { called: 3, obtained: 3 },
      { called: 9, obtained: 9 },
      { called: 6, obtained: 2 },
    ];
    expect(calcRound(missed, false)).toEqual({ teamAScore: -2, teamBScore: 21 });
    expect(calcRound(missed, true)).toEqual({ teamAScore: -7, teamBScore: 15 });
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

describe('playerCumulativeScore', () => {
  const rounds: Round[] = [
    { id: 1, entries: [{ called: 5, obtained: 5 }, { called: 2, obtained: 2 }, { called: 3, obtained: 3 }, { called: 2, obtained: 2 }], teamAScore: 12, teamBScore: 5 },
    { id: 2, entries: [{ called: 5, obtained: 4 }, { called: 2, obtained: 2 }, { called: 3, obtained: 3 }, { called: 2, obtained: 2 }], teamAScore: -3, teamBScore: 5 },
  ];

  it('sums a player across rounds under the default rule', () => {
    expect(playerCumulativeScore(rounds, 0, false)).toBe(5);
  });

  it('sums a player across rounds under harsh doubles', () => {
    expect(playerCumulativeScore(rounds, 0, true)).toBe(0);
  });

  it('is unaffected for a player who never missed', () => {
    expect(playerCumulativeScore(rounds, 1, false)).toBe(4);
    expect(playerCumulativeScore(rounds, 1, true)).toBe(4);
  });
});

describe('playerStats', () => {
  it('returns zeros for empty rounds', () => {
    expect(playerStats([], 0)).toEqual({ makeRate: 0, avgCalled: 0, avgObtained: 0 });
  });

  it('computes make rate and averages', () => {
    const rounds: Round[] = [
      { id: 1, entries: [{ called: 5, obtained: 5 }, { called: 2, obtained: 2 }, { called: 3, obtained: 3 }, { called: 2, obtained: 2 }], teamAScore: 12, teamBScore: 5 },
      { id: 2, entries: [{ called: 3, obtained: 1 }, { called: 2, obtained: 2 }, { called: 3, obtained: 3 }, { called: 2, obtained: 2 }], teamAScore: -1, teamBScore: 5 },
    ];
    expect(playerStats(rounds, 0)).toEqual({ makeRate: 0.5, avgCalled: 4, avgObtained: 3 });
  });
});
