import type { PlayerEntry, PlayerIndex, Round } from "./types";

export const SCORE_TABLE: Record<number, number> = {
  1: 1,  2: 2,  3: 3,  4: 4,
  5: 10, 6: 12, 7: 14, 8: 16,
  9: 27, 10: 40, 11: 44, 12: 48, 13: 52,
};

export function playerScore(called: number, obtained: number): number {
  return obtained >= called ? (SCORE_TABLE[called] ?? called) : -called;
}

export function calcRound(
  entries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry],
): { teamAScore: number; teamBScore: number } {
  const teamAScore =
    playerScore(entries[0].called, entries[0].obtained) +
    playerScore(entries[1].called, entries[1].obtained);
  const teamBScore =
    playerScore(entries[2].called, entries[2].obtained) +
    playerScore(entries[3].called, entries[3].obtained);
  return { teamAScore, teamBScore };
}

export function runningTotals(rounds: Round[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const round of rounds) {
    a += round.teamAScore;
    b += round.teamBScore;
  }
  return { a, b };
}

export function playerCumulativeScore(rounds: Round[], playerIndex: PlayerIndex): number {
  return rounds.reduce((sum, r) => {
    const e = r.entries[playerIndex];
    return sum + playerScore(e.called, e.obtained);
  }, 0);
}

export function playerStats(
  rounds: Round[],
  playerIndex: PlayerIndex,
): { makeRate: number; avgCalled: number; avgObtained: number } {
  if (rounds.length === 0) {
    return { makeRate: 0, avgCalled: 0, avgObtained: 0 };
  }

  let made = 0;
  let totalCalled = 0;
  let totalObtained = 0;

  for (const round of rounds) {
    const entry = round.entries[playerIndex];
    totalCalled += entry.called;
    totalObtained += entry.obtained;
    if (entry.obtained >= entry.called) {
      made += 1;
    }
  }

  return {
    makeRate: made / rounds.length,
    avgCalled: totalCalled / rounds.length,
    avgObtained: totalObtained / rounds.length,
  };
}
