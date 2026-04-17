export type PlayerIndex = 0 | 1 | 2 | 3;

export interface PlayerEntry {
  called: number;
  obtained: number;
}

export interface Round {
  id: number;
  entries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry];
  teamAScore: number;  // adjusted score this round
  teamBScore: number;
  comment?: string;
}

export interface GameState {
  phase: "setup" | "playing" | "finished";
  players: [string, string, string, string];
  scoreLimit: number;
  rounds: Round[];
  winner: "A" | "B" | null;
}
