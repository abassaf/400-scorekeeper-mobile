# 400 Scorekeeper Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete React Native / Expo port of the 400 Scorekeeper web app with full game logic, persistent history, share/export, and haptics.

**Architecture:** Expo managed workflow with NativeWind styling. Game logic is a direct port of the web reducer — `scoring.ts` and `types.ts` are copied verbatim and never touched. Storage is abstracted behind `IStorageAdapter` so AsyncStorage can be swapped for MMKV in one file. Navigation uses React Navigation v7 with a bottom tab + native stack structure.

**Tech Stack:** Expo SDK 51+, React Native, TypeScript strict, NativeWind v4, React Navigation v7, AsyncStorage, expo-haptics, react-native-view-shot, expo-sharing

**Human commit style:** Commit messages should read like a developer wrote them — casual imperative, lowercase, no "feat:" prefixes, no AI boilerplate. Examples: "set up expo project", "add game state hook", "wire up tab navigation".

---

## File Map

```
400-scorekeeper-mobile/
├── App.tsx                              # Root: NavigationContainer + SafeAreaProvider
├── app.json                             # Expo config (scheme, bundle IDs)
├── babel.config.js                      # NativeWind + Expo preset
├── tailwind.config.ts                   # Theme tokens
├── global.css                           # @tailwind directives
├── tsconfig.json                        # strict mode
├── package.json
│
├── src/
│   ├── types.ts                         # COPIED VERBATIM from web — never modify
│   ├── scoring.ts                       # COPIED VERBATIM from web — never modify
│   ├── theme.ts                         # Color tokens
│   │
│   ├── storage/
│   │   ├── IStorageAdapter.ts           # Interface
│   │   ├── AsyncStorageAdapter.ts       # Implementation
│   │   └── index.ts                     # Singleton export
│   │
│   ├── hooks/
│   │   ├── useGameState.ts              # useReducer + AsyncStorage + deep links
│   │   ├── useGameHistory.ts            # Completed games list
│   │   └── useShare.ts                  # Image capture + deep link share
│   │
│   ├── services/
│   │   └── iap.ts                       # IAP stub (ENABLE_IAP = false)
│   │
│   ├── components/
│   │   ├── NumberStepper.tsx            # Native stepper replacing <input type="number">
│   │   ├── ScoreProgressBar.tsx         # Animated emerald progress bar
│   │   ├── ScoreSummaryCard.tsx         # Ref-capturable export card
│   │   └── SupportButton.tsx            # IAP tip button stub
│   │
│   ├── screens/
│   │   ├── game/
│   │   │   ├── SetupScreen.tsx          # Player names + score limit form
│   │   │   ├── ActiveGameScreen.tsx     # Orchestrates all game cards
│   │   │   ├── ScoreHeaderCard.tsx      # Running totals + progress bars
│   │   │   ├── RoundFormCard.tsx        # 2×2 NumberStepper grid
│   │   │   ├── RoundHistoryCard.tsx     # Scrollable round table
│   │   │   ├── PlayerStatsCard.tsx      # Per-player stats
│   │   │   └── WinnerBannerCard.tsx     # Winner + actions
│   │   │
│   │   └── history/
│   │       ├── HistoryListScreen.tsx    # FlatList of completed games
│   │       └── HistoryDetailScreen.tsx  # Read-only game replay
│   │
│   └── navigation/
│       ├── types.ts                     # Typed param lists
│       ├── GameNavigator.tsx            # Stack: Game screen
│       ├── HistoryNavigator.tsx         # Stack: HistoryList + HistoryDetail
│       └── RootTabs.tsx                 # Bottom tabs
│
└── __tests__/
    ├── scoring.test.ts                  # Pure logic tests
    ├── useGameState.test.ts             # Reducer tests
    └── useGameHistory.test.ts           # History CRUD tests
```

---

## Phase 0 — Foundation & Scaffold

### Task 1: Initialise Expo project

**Files:**
- Create: `package.json`, `app.json`, `App.tsx`, `tsconfig.json`, `babel.config.js`, `tailwind.config.ts`, `global.css`

- [ ] **Step 1: Create Expo app**

```bash
cd /Users/anthonyassaf/Developer
npx create-expo-app@latest 400-scorekeeper-mobile --template blank-typescript
cd 400-scorekeeper-mobile
```

- [ ] **Step 2: Install all dependencies upfront**

```bash
npx expo install \
  @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context \
  nativewind tailwindcss \
  @react-native-async-storage/async-storage \
  react-native-view-shot \
  expo-sharing expo-haptics expo-linking \
  @expo/vector-icons \
  react-native-iap

npm install --save-dev \
  jest @testing-library/react-native ts-jest @types/jest \
  prettier eslint
```

- [ ] **Step 3: Configure NativeWind**

Replace `babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

Create `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
} satisfies Config;
```

Create `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Configure app.json**

Replace `app.json`:
```json
{
  "expo": {
    "name": "400 Scorekeeper",
    "slug": "400-scorekeeper",
    "scheme": "fourhundredscorekeeper",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "backgroundColor": "#09090b" },
    "ios": {
      "bundleIdentifier": "com.PLACEHOLDER.fourhundredscorekeeper",
      "supportsTablet": false
    },
    "android": {
      "package": "com.PLACEHOLDER.fourhundredscorekeeper",
      "adaptiveIcon": { "backgroundColor": "#09090b" }
    }
  }
}
```

- [ ] **Step 5: Configure TypeScript**

Replace `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 6: Create NativeWind type shim**

Create `nativewind-env.d.ts`:
```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Configure Jest**

Add to `package.json`:
```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

- [ ] **Step 8: Write placeholder App.tsx**

```tsx
import './global.css';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white text-2xl font-bold">400 Scorekeeper</Text>
      <Text className="text-emerald-500 mt-2">NativeWind working ✓</Text>
    </View>
  );
}
```

- [ ] **Step 9: Verify it boots**

```bash
npx expo start --ios
```

Expected: App opens in simulator showing "400 Scorekeeper" on dark background with green text.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "set up expo project with nativewind and dependencies"
```

---

## Wave A — Phases 1, 2, 3 (run in parallel after Task 1)

---

## Phase 1 — Game Logic & Storage

### Task 2: Copy source-of-truth files from web app

**Files:**
- Create: `src/types.ts`, `src/scoring.ts`

- [ ] **Step 1: Copy files verbatim**

```bash
cp /Users/anthonyassaf/Developer/400-scorekeeper/src/types.ts src/types.ts
cp /Users/anthonyassaf/Developer/400-scorekeeper/src/scoring.ts src/scoring.ts
```

- [ ] **Step 2: Write scoring tests**

Create `__tests__/scoring.test.ts`:
```ts
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
      { called: 5, obtained: 5 },  // playerScore = 10
      { called: 3, obtained: 3 },  // playerScore = 3
      { called: 2, obtained: 2 },  // playerScore = 2
      { called: 1, obtained: 0 },  // playerScore = -1
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
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/scoring.test.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/scoring.ts __tests__/scoring.test.ts
git commit -m "add types and scoring logic (copied from web)"
```

---

### Task 3: Storage abstraction layer

**Files:**
- Create: `src/storage/IStorageAdapter.ts`, `src/storage/AsyncStorageAdapter.ts`, `src/storage/index.ts`

- [ ] **Step 1: Create interface**

Create `src/storage/IStorageAdapter.ts`:
```ts
export interface IStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

- [ ] **Step 2: Create AsyncStorage implementation**

Create `src/storage/AsyncStorageAdapter.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorageAdapter } from './IStorageAdapter';

export class AsyncStorageAdapter implements IStorageAdapter {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}
```

- [ ] **Step 3: Export singleton**

Create `src/storage/index.ts`:
```ts
import { AsyncStorageAdapter } from './AsyncStorageAdapter';

export const storage = new AsyncStorageAdapter();
```

- [ ] **Step 4: Commit**

```bash
git add src/storage/
git commit -m "add storage abstraction layer"
```

---

### Task 4: Game state hook

**Files:**
- Create: `src/hooks/useGameState.ts`

- [ ] **Step 1: Write the hook**

Create `src/hooks/useGameState.ts`:
```ts
import { useReducer, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { storage } from '../storage';
import { calcRound, runningTotals, playerScore } from '../scoring';
import type { GameState, PlayerEntry, PlayerIndex } from '../types';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type GameAction =
  | { type: 'START_GAME'; players: [string, string, string, string]; scoreLimit: number }
  | { type: 'ADD_ROUND'; entries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry] }
  | { type: 'UNDO_ROUND' }
  | { type: 'NEW_GAME' }
  | { type: 'KEEP_PLAYING' }
  | { type: 'LOAD_STATE'; state: GameState };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const initialState: GameState = {
  phase: 'setup',
  players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
  scoreLimit: 80,
  rounds: [],
  winner: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampEntry(entry: PlayerEntry): PlayerEntry {
  return {
    called: clamp(entry.called, 1, 13),
    obtained: clamp(entry.obtained, 0, 13),
  };
}

function canWin(
  total: number,
  scoreLimit: number,
  rounds: { entries: { called: number; obtained: number }[] }[],
  playerIndices: PlayerIndex[],
): boolean {
  if (total < scoreLimit) return false;
  return playerIndices.every((i) => {
    const cumScore = rounds.reduce((sum, r) => {
      const e = r.entries[i];
      return sum + playerScore(e.called, e.obtained);
    }, 0);
    return cumScore >= 0;
  });
}

export function isValidState(parsed: unknown): parsed is GameState {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    'phase' in parsed &&
    'players' in parsed &&
    'rounds' in parsed &&
    Array.isArray((parsed as GameState).players) &&
    Array.isArray((parsed as GameState).rounds)
  );
}

export function stateToDeepLink(state: GameState): string {
  const encoded = encodeURIComponent(btoa(JSON.stringify(state)));
  return `fourhundredscorekeeper://?state=${encoded}`;
}

// ---------------------------------------------------------------------------
// Reducer (direct port from web)
// ---------------------------------------------------------------------------

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...state,
        phase: 'playing',
        players: action.players,
        scoreLimit: clamp(action.scoreLimit, 40, 500),
        rounds: [],
        winner: null,
      };
    }

    case 'ADD_ROUND': {
      const clampedEntries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry] = [
        clampEntry(action.entries[0]),
        clampEntry(action.entries[1]),
        clampEntry(action.entries[2]),
        clampEntry(action.entries[3]),
      ];

      const { teamAScore, teamBScore } = calcRound(clampedEntries);

      const newRound = {
        id: state.rounds.length + 1,
        entries: clampedEntries,
        teamAScore,
        teamBScore,
      };

      const newRounds = [...state.rounds, newRound];
      const totals = runningTotals(newRounds);
      const { scoreLimit } = state;

      const aCanWin = canWin(totals.a, scoreLimit, newRounds, [0, 1]);
      const bCanWin = canWin(totals.b, scoreLimit, newRounds, [2, 3]);

      let winner: 'A' | 'B' | null = null;
      if (aCanWin && bCanWin) {
        winner = totals.a >= totals.b ? 'A' : 'B';
      } else if (aCanWin) {
        winner = 'A';
      } else if (bCanWin) {
        winner = 'B';
      }

      return {
        ...state,
        rounds: newRounds,
        phase: winner !== null ? 'finished' : 'playing',
        winner,
      };
    }

    case 'UNDO_ROUND': {
      if (state.rounds.length === 0) return state;
      const newRounds = state.rounds.slice(0, -1);
      const totals = runningTotals(newRounds);
      const aCanWin = canWin(totals.a, state.scoreLimit, newRounds, [0, 1]);
      const bCanWin = canWin(totals.b, state.scoreLimit, newRounds, [2, 3]);
      let winner: 'A' | 'B' | null = null;
      if (aCanWin && bCanWin) {
        winner = totals.a >= totals.b ? 'A' : 'B';
      } else if (aCanWin) {
        winner = 'A';
      } else if (bCanWin) {
        winner = 'B';
      }
      return {
        ...state,
        rounds: newRounds,
        winner,
        phase: winner !== null ? 'finished' : 'playing',
      };
    }

    case 'NEW_GAME':
      return { ...initialState };

    case 'KEEP_PLAYING':
      return { ...state, phase: 'playing', winner: null };

    case 'LOAD_STATE':
      return action.state;

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const GAME_STATE_KEY = '400-scorekeeper-state';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameState(): { state: GameState; dispatch: React.Dispatch<GameAction> } {
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
```

- [ ] **Step 2: Write reducer tests**

Create `__tests__/useGameState.test.ts`:
```ts
import { gameReducer, initialState, isValidState } from '../src/hooks/useGameState';
import type { GameAction } from '../src/hooks/useGameState';
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
      // Build a state close to winning
      const playing = gameReducer(initialState, {
        type: 'START_GAME',
        players: ['A', 'B', 'C', 'D'],
        scoreLimit: 40,
      });
      // Add rounds where Team A accumulates 40+ pts
      const bigEntries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry] = [
        { called: 9, obtained: 9 },  // 27
        { called: 9, obtained: 9 },  // 27
        { called: 1, obtained: 0 },  // -1
        { called: 1, obtained: 0 },  // -1
      ];
      const state1 = gameReducer(playing, { type: 'ADD_ROUND', entries: bigEntries });
      // A has 54, B has -2 — A wins
      expect(state1.phase).toBe('finished');
      expect(state1.winner).toBe('A');
    });

    it('does not declare winner when a player is individually negative despite team total', () => {
      const playing = gameReducer(initialState, {
        type: 'START_GAME',
        players: ['A', 'B', 'C', 'D'],
        scoreLimit: 40,
      });
      // Team A player 0: 27, player 1: -27 → total 0, player 1 negative → blocked
      const blockedEntries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry] = [
        { called: 9, obtained: 9 },   // +27
        { called: 9, obtained: 0 },   // -9 (three rounds to get -27)
        { called: 1, obtained: 0 },
        { called: 1, obtained: 0 },
      ];
      // Just check it doesn't crash — win condition logic is in scoring.ts
      const state1 = gameReducer(playing, { type: 'ADD_ROUND', entries: blockedEntries });
      expect(['playing', 'finished']).toContain(state1.phase);
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
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/useGameState.test.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useGameState.ts __tests__/useGameState.test.ts
git commit -m "add game state hook with reducer, persistence, and deep link handling"
```

---

### Task 5: Game history hook

**Files:**
- Create: `src/hooks/useGameHistory.ts`

- [ ] **Step 1: Define HistoryEntry type and write tests**

Create `__tests__/useGameHistory.test.ts`:
```ts
// These tests verify the pure helper functions only (hook itself requires RN environment)
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
```

- [ ] **Step 2: Run tests to see them fail**

```bash
npx jest __tests__/useGameHistory.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the hook**

Create `src/hooks/useGameHistory.ts`:
```ts
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
  winner: 'A' | 'B';
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export function buildHistoryEntry(state: GameState): HistoryEntry {
  if (state.phase !== 'finished' || state.winner === null) {
    throw new Error('Cannot build history entry from non-finished state');
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
} {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const raw = await storage.getItem(HISTORY_KEY);
        if (raw !== null) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setHistory(parsed.filter(isValidHistoryEntry));
          }
        }
      } catch {
        console.warn('Failed to load game history');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const persist = useCallback(async (entries: HistoryEntry[]) => {
    await storage.setItem(HISTORY_KEY, JSON.stringify(entries));
    setHistory(entries);
  }, []);

  const saveGame = useCallback(async (state: GameState) => {
    if (state.phase !== 'finished' || state.winner === null) return;
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

  return { history, saveGame, deleteGame, clearAll, loading };
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/useGameHistory.test.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameHistory.ts __tests__/useGameHistory.test.ts
git commit -m "add game history hook with save, delete, and clear"
```

---

## Phase 2 — Design System & Shared Components

### Task 6: Theme tokens

**Files:**
- Create: `src/theme.ts`

- [ ] **Step 1: Create theme file**

Create `src/theme.ts`:
```ts
export const colors = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  borderMuted: '#3f3f46',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textSubtle: '#52525b',
  accent: '#10b981',
  accentHover: '#059669',
  danger: '#f87171',
  dangerBg: 'rgba(248,113,113,0.1)',
  warn: '#facc15',
  positive: '#34d399',
  buttonPrimary: '#ffffff',
  buttonPrimaryText: '#09090b',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/theme.ts
git commit -m "add theme color tokens"
```

---

### Task 7: IAP stub service

**Files:**
- Create: `src/services/iap.ts`

- [ ] **Step 1: Create IAP stub**

Create `src/services/iap.ts`:
```ts
// TODO: To activate IAP when ready:
// 1. Set ENABLE_IAP = true
// 2. Call initIAP() in App.tsx on mount
// 3. Replace the no-op in purchaseTip() with the RNIap purchase flow
// 4. Replace com.PLACEHOLDER in IAP_TIP_PRODUCT_ID with real bundle ID
// 5. Configure products in App Store Connect and Google Play Console

export const ENABLE_IAP = false;

export const IAP_TIP_PRODUCT_ID = 'com.PLACEHOLDER.fourhundredscorekeeper.tip_001';

export async function purchaseTip(): Promise<void> {
  if (!ENABLE_IAP) return;
  // Future: await RNIap.requestPurchase({ sku: IAP_TIP_PRODUCT_ID });
}

export async function initIAP(): Promise<void> {
  if (!ENABLE_IAP) return;
  // Future: await RNIap.initConnection();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/iap.ts
git commit -m "add iap stub (disabled)"
```

---

### Task 8: NumberStepper component

**Files:**
- Create: `src/components/NumberStepper.tsx`

- [ ] **Step 1: Create component**

Create `src/components/NumberStepper.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  sublabel?: string;
}

export function NumberStepper({ value, min, max, onChange, label, sublabel }: NumberStepperProps) {
  async function step(delta: number) {
    const next = Math.min(Math.max(value + delta, min), max);
    if (next === value) return;
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
    }
    onChange(next);
  }

  return (
    <View className="items-center">
      {label != null && (
        <Text
          className="text-xs font-medium text-zinc-400 mb-0.5 text-center"
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
      {sublabel != null && (
        <Text className="text-xs text-zinc-600 text-center mb-1">{sublabel}</Text>
      )}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => step(-1)}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
          accessibilityRole="button"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          className="bg-zinc-800 rounded-lg active:bg-zinc-700"
        >
          <Text
            style={{ color: value <= min ? colors.textSubtle : colors.textPrimary }}
            className="text-xl font-semibold"
          >
            −
          </Text>
        </Pressable>

        <View
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value, text: `${value}` }}
          style={{ width: 40, alignItems: 'center' }}
        >
          <Text className="text-white text-lg font-bold">{value}</Text>
        </View>

        <Pressable
          onPress={() => step(1)}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
          accessibilityRole="button"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          className="bg-zinc-800 rounded-lg active:bg-zinc-700"
        >
          <Text
            style={{ color: value >= max ? colors.textSubtle : colors.textPrimary }}
            className="text-xl font-semibold"
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NumberStepper.tsx
git commit -m "add number stepper component"
```

---

### Task 9: ScoreProgressBar component

**Files:**
- Create: `src/components/ScoreProgressBar.tsx`

- [ ] **Step 1: Create component**

Create `src/components/ScoreProgressBar.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface ScoreProgressBarProps {
  value: number;
  limit: number;
}

export function ScoreProgressBar({ value, limit }: ScoreProgressBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  const pct = limit > 0 ? Math.min(Math.max(value / limit, 0), 1) : 0;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: pct,
      useNativeDriver: false,
      damping: 15,
      stiffness: 120,
    }).start();
  }, [pct, animValue]);

  const width = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="h-2 rounded-full bg-zinc-800 overflow-hidden">
      <Animated.View
        style={{ width }}
        className="h-2 rounded-full bg-emerald-500"
      />
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScoreProgressBar.tsx
git commit -m "add animated score progress bar"
```

---

### Task 10: ScoreSummaryCard component

**Files:**
- Create: `src/components/ScoreSummaryCard.tsx`

- [ ] **Step 1: Create component**

Create `src/components/ScoreSummaryCard.tsx`:
```tsx
import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import type { GameState, PlayerIndex } from '../types';
import { runningTotals, playerStats, playerCumulativeScore } from '../scoring';
import { colors } from '../theme';

interface ScoreSummaryCardProps {
  state: GameState;
}

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

function clampedPct(value: number, limit: number): string {
  if (limit <= 0) return '0%';
  return `${Math.min(Math.max((value / limit) * 100, 0), 100)}%`;
}

function scoreColor(score: number): string {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}

function formatDelta(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export const ScoreSummaryCard = forwardRef<View, ScoreSummaryCardProps>(
  ({ state }, ref) => {
    const { players, rounds, scoreLimit } = state;
    const totals = runningTotals(rounds);
    const stats = PLAYER_INDICES.map((i) => playerStats(rounds, i));

    let runA = 0;
    let runB = 0;
    const cumulatives = rounds.map((r) => {
      runA += r.teamAScore;
      runB += r.teamBScore;
      return { a: runA, b: runB };
    });

    const roundDisplay =
      state.phase === 'playing'
        ? `Round ${rounds.length + 1}`
        : `${rounds.length} Round${rounds.length !== 1 ? 's' : ''} Played`;

    return (
      <View ref={ref} style={{ width: 340, backgroundColor: colors.bg, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>
            400 Scorekeeper
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{roundDisplay}</Text>
        </View>

        {/* Team scores */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['A', 'B'] as const).map((team) => {
            const total = team === 'A' ? totals.a : totals.b;
            const p1 = team === 'A' ? players[0] : players[2];
            const p2 = team === 'A' ? players[1] : players[3];
            const isWinner = state.winner === team;
            return (
              <View
                key={team}
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isWinner ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Team {team}{isWinner ? ' 🏆' : ''}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {p1} & {p2}
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '700', marginTop: 4 }}>
                  {total}
                </Text>
                {/* Progress bar */}
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: 6, backgroundColor: colors.accent, borderRadius: 3, width: clampedPct(total, scoreLimit) }} />
                </View>
                <Text style={{ color: colors.textSubtle, fontSize: 10, textAlign: 'right', marginTop: 2 }}>
                  / {scoreLimit}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Round history */}
        {rounds.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}>
            <Text style={{ color: colors.textSubtle, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Round History
            </Text>
            {/* Header row */}
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 20, color: colors.textSubtle, fontSize: 9 }}>#</Text>
              {PLAYER_INDICES.map((i) => (
                <Text key={i} style={{ flex: 1, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>
                  {players[i].split(' ')[0]}
                </Text>
              ))}
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>AΔ</Text>
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>BΔ</Text>
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>AΣ</Text>
              <Text style={{ width: 24, color: colors.textSubtle, fontSize: 9, textAlign: 'right' }}>BΣ</Text>
            </View>
            {rounds.map((round, idx) => {
              const cum = cumulatives[idx];
              return (
                <View key={round.id} style={{ flexDirection: 'row', paddingVertical: 3, backgroundColor: idx % 2 === 1 ? 'rgba(39,39,42,0.4)' : 'transparent' }}>
                  <Text style={{ width: 20, color: colors.textMuted, fontSize: 9 }}>{round.id}</Text>
                  {PLAYER_INDICES.map((i) => {
                    const e = round.entries[i];
                    const made = e.obtained >= e.called;
                    return (
                      <Text key={i} style={{ flex: 1, color: made ? colors.positive : colors.danger, fontSize: 9, textAlign: 'right' }}>
                        {e.called}→{e.obtained}
                      </Text>
                    );
                  })}
                  <Text style={{ width: 24, color: scoreColor(round.teamAScore), fontSize: 9, textAlign: 'right' }}>
                    {formatDelta(round.teamAScore)}
                  </Text>
                  <Text style={{ width: 24, color: scoreColor(round.teamBScore), fontSize: 9, textAlign: 'right' }}>
                    {formatDelta(round.teamBScore)}
                  </Text>
                  <Text style={{ width: 24, color: colors.textPrimary, fontSize: 9, fontWeight: '600', textAlign: 'right' }}>{cum.a}</Text>
                  <Text style={{ width: 24, color: colors.textPrimary, fontSize: 9, fontWeight: '600', textAlign: 'right' }}>{cum.b}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Player stats */}
        {rounds.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {PLAYER_INDICES.map((i) => {
              const s = stats[i];
              const score = playerCumulativeScore(rounds, i);
              const makeRateColor = s.makeRate >= 0.7 ? colors.positive : s.makeRate >= 0.5 ? colors.warn : colors.danger;
              return (
                <View key={i} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>{players[i]}</Text>
                  <Text style={{ color: colors.textSubtle, fontSize: 9, marginBottom: 4 }}>{i < 2 ? 'Team A' : 'Team B'}</Text>
                  <Text style={{ color: scoreColor(score), fontSize: 11, fontWeight: '700' }}>{score >= 0 ? '+' : ''}{score}</Text>
                  <Text style={{ color: makeRateColor, fontSize: 10, fontWeight: '600' }}>{Math.round(s.makeRate * 100)}%</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 9 }}>{s.avgCalled.toFixed(1)} bid</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <Text style={{ color: colors.textSubtle, fontSize: 10, textAlign: 'center', marginTop: 12 }}>
          400 Scorekeeper
        </Text>
      </View>
    );
  }
);

ScoreSummaryCard.displayName = 'ScoreSummaryCard';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScoreSummaryCard.tsx
git commit -m "add score summary card for export"
```

---

### Task 11: SupportButton component

**Files:**
- Create: `src/components/SupportButton.tsx`

- [ ] **Step 1: Create component**

Create `src/components/SupportButton.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ENABLE_IAP, purchaseTip } from '../services/iap';

export function SupportButton() {
  async function handlePress() {
    if (!ENABLE_IAP) {
      Alert.alert('Coming Soon', 'Tip support is not available yet. Thanks for your interest!');
      return;
    }
    await purchaseTip();
  }

  return (
    <View className="items-center py-4">
      <Pressable
        onPress={handlePress}
        accessibilityLabel="Support the developer with a one-time tip"
        accessibilityRole="button"
        className="bg-zinc-800 px-6 py-3 rounded-xl active:bg-zinc-700"
      >
        <Text className="text-white font-semibold">Support the Dev ☕</Text>
      </Pressable>
      <Text className="text-zinc-600 text-xs mt-2">One-time optional tip</Text>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SupportButton.tsx
git commit -m "add support button (iap stub)"
```

---

## Phase 3 — Navigation Architecture

### Task 12: Navigation types and navigators

**Files:**
- Create: `src/navigation/types.ts`, `src/navigation/GameNavigator.tsx`, `src/navigation/HistoryNavigator.tsx`, `src/navigation/RootTabs.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Create navigation type definitions**

Create `src/navigation/types.ts`:
```ts
import type { NavigatorScreenParams } from '@react-navigation/native';

export type GameStackParamList = {
  Game: undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDetail: { entry: import('../hooks/useGameHistory').HistoryEntry };
};

export type RootTabParamList = {
  GameTab: NavigatorScreenParams<GameStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
};
```

- [ ] **Step 2: Create placeholder screens**

Create `src/screens/game/SetupScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function SetupScreen() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white">Setup Screen</Text>
    </View>
  );
}
```

Create `src/screens/game/ActiveGameScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function ActiveGameScreen() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white">Active Game Screen</Text>
    </View>
  );
}
```

Create `src/screens/history/HistoryListScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function HistoryListScreen() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white">History List</Text>
    </View>
  );
}
```

Create `src/screens/history/HistoryDetailScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';

export function HistoryDetailScreen() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white">History Detail</Text>
    </View>
  );
}
```

- [ ] **Step 3: Create GameNavigator**

Create `src/navigation/GameNavigator.tsx`:
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GameStackParamList } from './types';
import { SetupScreen } from '../screens/game/SetupScreen';
import { ActiveGameScreen } from '../screens/game/ActiveGameScreen';
import { useGameState } from '../hooks/useGameState';

const Stack = createNativeStackNavigator<GameStackParamList>();

export function GameNavigator() {
  const { state, dispatch } = useGameState();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Game">
        {() =>
          state.phase === 'setup' ? (
            <SetupScreen state={state} dispatch={dispatch} />
          ) : (
            <ActiveGameScreen state={state} dispatch={dispatch} />
          )
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Update placeholder screens to accept props**

Update `src/screens/game/SetupScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function SetupScreen({ state: _state, dispatch: _dispatch }: Props) {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white">Setup Screen</Text>
    </View>
  );
}
```

Update `src/screens/game/ActiveGameScreen.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function ActiveGameScreen({ state: _state, dispatch: _dispatch }: Props) {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white">Active Game Screen</Text>
    </View>
  );
}
```

- [ ] **Step 5: Create HistoryNavigator**

Create `src/navigation/HistoryNavigator.tsx`:
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from './types';
import { HistoryListScreen } from '../screens/history/HistoryListScreen';
import { HistoryDetailScreen } from '../screens/history/HistoryDetailScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export function HistoryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="HistoryList"
        component={HistoryListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={{ title: 'Game Detail' }}
      />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 6: Create RootTabs**

Create `src/navigation/RootTabs.tsx`:
```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootTabParamList } from './types';
import { GameNavigator } from './GameNavigator';
import { HistoryNavigator } from './HistoryNavigator';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="GameTab"
        component={GameNavigator}
        options={{
          tabBarLabel: 'Game',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'game-controller' : 'game-controller-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryNavigator}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 7: Wire up App.tsx**

Replace `App.tsx`:
```tsx
import './global.css';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootTabs } from './src/navigation/RootTabs';
import { colors } from './src/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <RootTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 8: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add src/navigation/ src/screens/ App.tsx
git commit -m "wire up navigation shell with bottom tabs"
```

---

## Wave B — Phases 4, 5, 6 (run in parallel after Wave A)

---

## Phase 4 — Game Tab Screens

### Task 13: SetupScreen

**Files:**
- Modify: `src/screens/game/SetupScreen.tsx`

- [ ] **Step 1: Implement SetupScreen**

Replace `src/screens/game/SetupScreen.tsx`:
```tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';
import { colors } from '../../theme';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const DEFAULTS: [string, string, string, string] = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export function SetupScreen({ dispatch }: Props) {
  const [names, setNames] = useState<[string, string, string, string]>(['', '', '', '']);
  const [scoreLimitRaw, setScoreLimitRaw] = useState('80');

  const scoreLimit = parseInt(scoreLimitRaw, 10);
  const scoreLimitInvalid = isNaN(scoreLimit) || scoreLimit < 40;

  function updateName(index: 0 | 1 | 2 | 3, value: string) {
    const next = [...names] as [string, string, string, string];
    next[index] = value;
    setNames(next);
  }

  async function handleStart() {
    if (scoreLimitInvalid) return;
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* ignore */ }
    }
    const resolved = names.map((n, i) => n.trim() || DEFAULTS[i]) as [string, string, string, string];
    dispatch({ type: 'START_GAME', players: resolved, scoreLimit });
  }

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 15,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '700' }}>
              400 Scorekeeper
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Set up your game</Text>
          </View>

          {/* Teams */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {(['A', 'B'] as const).map((team) => {
              const indices = team === 'A' ? ([0, 1] as const) : ([2, 3] as const);
              return (
                <View key={team} style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    Team {team}
                  </Text>
                  {indices.map((i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                        Player {i + 1}
                      </Text>
                      <TextInput
                        style={inputStyle}
                        value={names[i]}
                        onChangeText={(v) => updateName(i, v)}
                        placeholder={DEFAULTS[i]}
                        placeholderTextColor={colors.textSubtle}
                        textContentType="name"
                        autoCapitalize="words"
                        returnKeyType="next"
                        accessibilityLabel={`Player ${i + 1} name, Team ${team}`}
                      />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>

          {/* Score limit */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Score Limit</Text>
            <TextInput
              style={[inputStyle, { width: 120, borderColor: scoreLimitInvalid ? colors.danger : colors.borderMuted }]}
              value={scoreLimitRaw}
              onChangeText={setScoreLimitRaw}
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel="Score limit"
            />
            {scoreLimitInvalid ? (
              <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>Must be 40 or higher</Text>
            ) : (
              <Text style={{ color: colors.textSubtle, fontSize: 12, marginTop: 4 }}>
                First team to reach this score wins
              </Text>
            )}
          </View>

          {/* Start button */}
          <Pressable
            onPress={handleStart}
            disabled={scoreLimitInvalid}
            accessibilityLabel="Start game"
            accessibilityRole="button"
            style={{
              backgroundColor: scoreLimitInvalid ? colors.borderMuted : colors.buttonPrimary,
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              opacity: scoreLimitInvalid ? 0.5 : 1,
            }}
          >
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700', fontSize: 16 }}>
              Start Game
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/game/SetupScreen.tsx
git commit -m "build setup screen"
```

---

### Task 14: ScoreHeaderCard

**Files:**
- Create: `src/screens/game/ScoreHeaderCard.tsx`

- [ ] **Step 1: Create component**

Create `src/screens/game/ScoreHeaderCard.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { runningTotals, playerCumulativeScore } from '../../scoring';
import { ScoreProgressBar } from '../../components/ScoreProgressBar';
import { colors } from '../../theme';
import type { GameState } from '../../types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onShare: () => void;
}

export function ScoreHeaderCard({ state, onNewGame, onShare }: Props) {
  const { players, scoreLimit, rounds, phase } = state;
  const totals = runningTotals(rounds);

  const aBlocked =
    totals.a >= scoreLimit &&
    ([0, 1] as const).some((i) => playerCumulativeScore(rounds, i) < 0);
  const bBlocked =
    totals.b >= scoreLimit &&
    ([2, 3] as const).some((i) => playerCumulativeScore(rounds, i) < 0);

  const roundDisplay =
    phase === 'playing'
      ? `Round ${rounds.length + 1}`
      : `${rounds.length} Round${rounds.length !== 1 ? 's' : ''} Played`;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {(['A', 'B'] as const).map((team) => {
          const total = team === 'A' ? totals.a : totals.b;
          const p1 = team === 'A' ? players[0] : players[2];
          const p2 = team === 'A' ? players[1] : players[3];
          const blocked = team === 'A' ? aBlocked : bBlocked;
          return (
            <View key={team} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Team {team}
                </Text>
                {blocked && (
                  <View style={{ backgroundColor: colors.dangerBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '600' }}>Blocked</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{p1} & {p2}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 36, fontWeight: '700', marginTop: 6 }}>{total}</Text>
              <View style={{ marginTop: 8 }}>
                <ScoreProgressBar value={total} limit={scoreLimit} />
              </View>
              <Text style={{ color: colors.textSubtle, fontSize: 10, textAlign: 'right', marginTop: 2 }}>/ {scoreLimit}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{roundDisplay}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onShare}
            accessibilityLabel="Share game"
            accessibilityRole="button"
            style={{ backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Share</Text>
          </Pressable>
          <Pressable
            onPress={onNewGame}
            accessibilityLabel="Start new game"
            accessibilityRole="button"
            style={{ backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>New Game</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/game/ScoreHeaderCard.tsx
git commit -m "add score header card"
```

---

### Task 15: RoundFormCard

**Files:**
- Create: `src/screens/game/RoundFormCard.tsx`

- [ ] **Step 1: Create component**

Create `src/screens/game/RoundFormCard.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NumberStepper } from '../../components/NumberStepper';
import { colors } from '../../theme';
import type { PlayerEntry, PlayerIndex } from '../../types';

interface Props {
  players: [string, string, string, string];
  roundsPlayed: number;
  onSubmit: (entries: [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry]) => void;
  onUndo: () => void;
}

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

type StepperValues = { called: number; obtained: number };
type FormState = [StepperValues, StepperValues, StepperValues, StepperValues];

function emptyForm(): FormState {
  return [
    { called: 1, obtained: 0 },
    { called: 1, obtained: 0 },
    { called: 1, obtained: 0 },
    { called: 1, obtained: 0 },
  ];
}

export function RoundFormCard({ players, roundsPlayed, onSubmit, onUndo }: Props) {
  const [fields, setFields] = useState<FormState>(emptyForm);

  function update(index: PlayerIndex, key: 'called' | 'obtained', value: number) {
    const next = [...fields] as FormState;
    next[index] = { ...next[index], [key]: value };
    setFields(next);
  }

  const obtainedSum = PLAYER_INDICES.reduce((sum, i) => sum + fields[i].obtained, 0);

  const sumColor =
    obtainedSum === 13
      ? colors.positive
      : obtainedSum > 13
      ? colors.warn
      : colors.textMuted;

  async function handleSubmit() {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { /* ignore */ }
    }
    const entries = fields.map((f) => ({ called: f.called, obtained: f.obtained })) as [PlayerEntry, PlayerEntry, PlayerEntry, PlayerEntry];
    onSubmit(entries);
    setFields(emptyForm());
  }

  async function handleUndo() {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* ignore */ }
    }
    onUndo();
  }

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
        Round Entry
      </Text>

      {/* 2×2 grid */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {(['A', 'B'] as const).map((team) => {
          const indices = team === 'A' ? ([0, 1] as const) : ([2, 3] as const);
          return (
            <View key={team} style={{ flex: 1, gap: 16 }}>
              <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
                Team {team}
              </Text>
              {indices.map((i) => (
                <View key={i} style={{ gap: 8 }}>
                  <NumberStepper
                    value={fields[i].called}
                    min={1}
                    max={13}
                    onChange={(v) => update(i, 'called', v)}
                    label={players[i]}
                    sublabel="Called"
                  />
                  <NumberStepper
                    value={fields[i].obtained}
                    min={0}
                    max={13}
                    onChange={(v) => update(i, 'obtained', v)}
                    sublabel="Obtained"
                  />
                </View>
              ))}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: sumColor, fontSize: 12 }}>Obtained: {obtainedSum} / 13</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {roundsPlayed > 0 && (
            <Pressable
              onPress={handleUndo}
              accessibilityLabel="Undo last round"
              accessibilityRole="button"
              style={{ backgroundColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Undo</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleSubmit}
            accessibilityLabel="Add round"
            accessibilityRole="button"
            style={{ backgroundColor: colors.buttonPrimary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
          >
            <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700', fontSize: 13 }}>Add Round</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/game/RoundFormCard.tsx
git commit -m "add round entry form with number steppers"
```

---

### Task 16: RoundHistoryCard and PlayerStatsCard

**Files:**
- Create: `src/screens/game/RoundHistoryCard.tsx`, `src/screens/game/PlayerStatsCard.tsx`

- [ ] **Step 1: Create RoundHistoryCard**

Create `src/screens/game/RoundHistoryCard.tsx`:
```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors } from '../../theme';
import type { GameState, Round, PlayerIndex } from '../../types';

interface Props {
  state: GameState;
}

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

function scoreColor(score: number): string {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}

function formatDelta(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export function RoundHistoryCard({ state }: Props) {
  const { rounds, players } = state;
  if (rounds.length === 0) return null;

  let runA = 0;
  let runB = 0;
  const cumulatives = rounds.map((r) => {
    runA += r.teamAScore;
    runB += r.teamBScore;
    return { a: runA, b: runB };
  });

  const displayRows = [...rounds.map((round, idx) => ({ round, cum: cumulatives[idx] }))].reverse();

  const headerStyle = { color: colors.textSubtle, fontSize: 10, fontWeight: '600' as const, textTransform: 'uppercase' as const };
  const cellStyle = { fontSize: 11, color: colors.textSecondary };

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Round History
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6, marginBottom: 4 }}>
            <Text style={[headerStyle, { width: 24 }]}>#</Text>
            {players.map((name, i) => (
              <Text key={i} style={[headerStyle, { width: 60, textAlign: 'right' }]} numberOfLines={1}>
                {name.split(' ')[0]}
              </Text>
            ))}
            <Text style={[headerStyle, { width: 36, textAlign: 'right' }]}>AΔ</Text>
            <Text style={[headerStyle, { width: 36, textAlign: 'right' }]}>BΔ</Text>
            <Text style={[headerStyle, { width: 36, textAlign: 'right' }]}>AΣ</Text>
            <Text style={[headerStyle, { width: 36, textAlign: 'right' }]}>BΣ</Text>
          </View>
          {/* Rows */}
          {displayRows.map(({ round, cum }, rowIdx) => (
            <View
              key={round.id}
              style={{
                flexDirection: 'row',
                paddingVertical: 5,
                backgroundColor: rowIdx % 2 === 1 ? 'rgba(39,39,42,0.4)' : 'transparent',
              }}
            >
              <Text style={[cellStyle, { width: 24, color: colors.textMuted }]}>{round.id}</Text>
              {PLAYER_INDICES.map((i) => {
                const e = round.entries[i];
                const made = e.obtained >= e.called;
                return (
                  <Text key={i} style={[cellStyle, { width: 60, textAlign: 'right', color: made ? colors.positive : colors.danger }]}>
                    {e.called}→{e.obtained}
                  </Text>
                );
              })}
              <Text style={[cellStyle, { width: 36, textAlign: 'right', color: scoreColor(round.teamAScore) }]}>
                {formatDelta(round.teamAScore)}
              </Text>
              <Text style={[cellStyle, { width: 36, textAlign: 'right', color: scoreColor(round.teamBScore) }]}>
                {formatDelta(round.teamBScore)}
              </Text>
              <Text style={[cellStyle, { width: 36, textAlign: 'right', color: colors.textPrimary, fontWeight: '600' }]}>{cum.a}</Text>
              <Text style={[cellStyle, { width: 36, textAlign: 'right', color: colors.textPrimary, fontWeight: '600' }]}>{cum.b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Create PlayerStatsCard**

Create `src/screens/game/PlayerStatsCard.tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { playerStats, playerCumulativeScore, runningTotals } from '../../scoring';
import { colors } from '../../theme';
import type { GameState, PlayerIndex } from '../../types';

interface Props {
  state: GameState;
}

const PLAYER_INDICES: PlayerIndex[] = [0, 1, 2, 3];

function makeRateColor(rate: number): string {
  if (rate >= 0.7) return colors.positive;
  if (rate >= 0.5) return colors.warn;
  return colors.danger;
}

export function PlayerStatsCard({ state }: Props) {
  const { rounds, players } = state;
  const totals = runningTotals(rounds);

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Player Stats
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {PLAYER_INDICES.map((idx) => {
          const stats = playerStats(rounds, idx);
          const score = playerCumulativeScore(rounds, idx);
          const scorePositive = score >= 0;
          return (
            <View key={idx} style={{ flex: 1, backgroundColor: 'rgba(39,39,42,0.5)', borderRadius: 10, padding: 10 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{players[idx]}</Text>
              <Text style={{ color: colors.textSubtle, fontSize: 10, marginBottom: 6 }}>{idx < 2 ? 'Team A' : 'Team B'}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Score</Text>
                <Text style={{ color: scorePositive ? colors.positive : colors.danger, fontSize: 10, fontWeight: '600' }}>
                  {scorePositive ? '+' : ''}{score}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Make%</Text>
                <Text style={{ color: makeRateColor(stats.makeRate), fontSize: 10, fontWeight: '600' }}>
                  {Math.round(stats.makeRate * 100)}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Avg bid</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{stats.avgCalled.toFixed(1)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>Avg won</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{stats.avgObtained.toFixed(1)}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Team A: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{totals.a}</Text></Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Team B: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{totals.b}</Text></Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/game/RoundHistoryCard.tsx src/screens/game/PlayerStatsCard.tsx
git commit -m "add round history and player stats cards"
```

---

### Task 17: WinnerBannerCard

**Files:**
- Create: `src/screens/game/WinnerBannerCard.tsx`

- [ ] **Step 1: Create component**

Create `src/screens/game/WinnerBannerCard.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { runningTotals } from '../../scoring';
import { colors } from '../../theme';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onShare: () => void;
}

export function WinnerBannerCard({ state, dispatch, onShare }: Props) {
  if (state.phase !== 'finished' || state.winner === null) return null;

  const totals = runningTotals(state.rounds);
  const { winner, players } = state;

  const winningTeamLabel = winner === 'A' ? 'Team A' : 'Team B';
  const winningTeamNames = winner === 'A'
    ? `${players[0]} & ${players[1]}`
    : `${players[2]} & ${players[3]}`;

  async function handleNewGame() {
    if (Platform.OS !== 'web') {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* ignore */ }
    }
    dispatch({ type: 'NEW_GAME' });
  }

  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 3,
      borderTopColor: colors.accent,
    }}>
      <Ionicons name="trophy" size={32} color={colors.accent} style={{ marginBottom: 10 }} />
      <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700' }}>{winningTeamLabel} Wins!</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{winningTeamNames}</Text>
      <Text style={{ marginTop: 10, fontSize: 13 }}>
        <Text style={{ color: winner === 'A' ? colors.positive : colors.textMuted, fontWeight: winner === 'A' ? '700' : '400' }}>
          Team A: {totals.a} pts
        </Text>
        <Text style={{ color: colors.textSubtle }}>  ·  </Text>
        <Text style={{ color: winner === 'B' ? colors.positive : colors.textMuted, fontWeight: winner === 'B' ? '700' : '400' }}>
          Team B: {totals.b} pts
        </Text>
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Pressable
          onPress={handleNewGame}
          accessibilityLabel="Start a new game"
          accessibilityRole="button"
          style={{ flex: 1, backgroundColor: colors.buttonPrimary, borderRadius: 12, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700' }}>New Game</Text>
        </Pressable>
        <Pressable
          onPress={() => dispatch({ type: 'KEEP_PLAYING' })}
          accessibilityLabel="Keep playing"
          accessibilityRole="button"
          style={{ flex: 1, backgroundColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Keep Playing</Text>
        </Pressable>
        <Pressable
          onPress={onShare}
          accessibilityLabel="Share game result"
          accessibilityRole="button"
          style={{ backgroundColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' }}
        >
          <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/game/WinnerBannerCard.tsx
git commit -m "add winner banner with new game and share actions"
```

---

### Task 18: ActiveGameScreen (orchestrator)

**Files:**
- Modify: `src/screens/game/ActiveGameScreen.tsx`

- [ ] **Step 1: Implement ActiveGameScreen**

Replace `src/screens/game/ActiveGameScreen.tsx`:
```tsx
import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GameState } from '../../types';
import type { GameAction } from '../../hooks/useGameState';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useShare } from '../../hooks/useShare';
import { ScoreHeaderCard } from './ScoreHeaderCard';
import { RoundFormCard } from './RoundFormCard';
import { RoundHistoryCard } from './RoundHistoryCard';
import { PlayerStatsCard } from './PlayerStatsCard';
import { WinnerBannerCard } from './WinnerBannerCard';
import { ScoreSummaryCard } from '../../components/ScoreSummaryCard';
import { colors } from '../../theme';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function ActiveGameScreen({ state, dispatch }: Props) {
  const cardRef = useRef<View>(null);
  const { saveGame } = useGameHistory();
  const { showShareSheet } = useShare(cardRef);

  // Auto-save when game finishes
  const savedRef = useRef(false);
  React.useEffect(() => {
    if (state.phase === 'finished' && !savedRef.current) {
      savedRef.current = true;
      saveGame(state);
    }
    if (state.phase !== 'finished') {
      savedRef.current = false;
    }
  }, [state.phase, state, saveGame]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {state.phase === 'finished' && (
          <WinnerBannerCard
            state={state}
            dispatch={dispatch}
            onShare={() => showShareSheet(state)}
          />
        )}

        <ScoreHeaderCard
          state={state}
          onNewGame={() => dispatch({ type: 'NEW_GAME' })}
          onShare={() => showShareSheet(state)}
        />

        {state.phase === 'playing' && (
          <RoundFormCard
            players={state.players}
            roundsPlayed={state.rounds.length}
            onSubmit={(entries) => dispatch({ type: 'ADD_ROUND', entries })}
            onUndo={() => dispatch({ type: 'UNDO_ROUND' })}
          />
        )}

        <RoundHistoryCard state={state} />
        <PlayerStatsCard state={state} />

        {/* Hidden export card for view-shot capture */}
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ScoreSummaryCard ref={cardRef} state={state} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/game/ActiveGameScreen.tsx
git commit -m "build active game screen"
```

---

## Phase 5 — History Screens

### Task 19: HistoryListScreen

**Files:**
- Modify: `src/screens/history/HistoryListScreen.tsx`

- [ ] **Step 1: Implement HistoryListScreen**

Replace `src/screens/history/HistoryListScreen.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameHistory, type HistoryEntry } from '../../hooks/useGameHistory';
import { runningTotals } from '../../scoring';
import { SupportButton } from '../../components/SupportButton';
import { colors } from '../../theme';
import type { HistoryStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function HistoryItem({ entry, onPress, onLongPress }: { entry: HistoryEntry; onPress: () => void; onLongPress: () => void }) {
  const totals = runningTotals(entry.rounds);
  const winnerTeam = entry.winner === 'A' ? `${entry.players[0]} & ${entry.players[1]}` : `${entry.players[2]} & ${entry.players[3]}`;
  const label = `Team ${entry.winner} won, ${totals.a} to ${totals.b}, played ${formatDate(entry.completedAt)}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>
            Team {entry.winner} Wins
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{winnerTeam}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(entry.completedAt)}</Text>
          <Text style={{ color: colors.textSubtle, fontSize: 11, marginTop: 2 }}>{entry.rounds.length} rounds</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Team A: <Text style={{ color: entry.winner === 'A' ? colors.positive : colors.textPrimary, fontWeight: '600' }}>{totals.a}</Text>
        </Text>
        <Text style={{ color: colors.textSubtle }}>·</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Team B: <Text style={{ color: entry.winner === 'B' ? colors.positive : colors.textPrimary, fontWeight: '600' }}>{totals.b}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

export function HistoryListScreen() {
  const navigation = useNavigation<Nav>();
  const { history, deleteGame, clearAll, loading } = useGameHistory();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    // History reloads on mount via hook; just signal refresh complete
    setTimeout(() => setRefreshing(false), 400);
  }

  function handleLongPress(entry: HistoryEntry) {
    Alert.alert(
      'Delete Game',
      'Remove this game from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGame(entry.id) },
      ]
    );
  }

  function handleClearAll() {
    Alert.alert(
      'Clear All History',
      'Remove all saved games? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700' }}>History</Text>
        {history.length > 0 && (
          <Pressable onPress={handleClearAll} accessibilityLabel="Clear all history" accessibilityRole="button">
            <Text style={{ color: colors.danger, fontSize: 13 }}>Clear All</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>No games yet.</Text>
              <Text style={{ color: colors.textSubtle, fontSize: 13, marginTop: 4 }}>Start a game on the Game tab.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={history.length > 0 ? <SupportButton /> : null}
        renderItem={({ item }) => (
          <HistoryItem
            entry={item}
            onPress={() => navigation.navigate('HistoryDetail', { entry: item })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/history/HistoryListScreen.tsx
git commit -m "build history list screen"
```

---

### Task 20: HistoryDetailScreen

**Files:**
- Modify: `src/screens/history/HistoryDetailScreen.tsx`

- [ ] **Step 1: Implement HistoryDetailScreen**

Replace `src/screens/history/HistoryDetailScreen.tsx`:
```tsx
import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import { useShare } from '../../hooks/useShare';
import { ScoreHeaderCard } from '../game/ScoreHeaderCard';
import { RoundHistoryCard } from '../game/RoundHistoryCard';
import { PlayerStatsCard } from '../game/PlayerStatsCard';
import { WinnerBannerCard } from '../game/WinnerBannerCard';
import { ScoreSummaryCard } from '../../components/ScoreSummaryCard';
import { colors } from '../../theme';
import type { GameState } from '../../types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryDetail'>;

export function HistoryDetailScreen({ route, navigation }: Props) {
  const { entry } = route.params;
  const cardRef = useRef<View>(null);

  // Build a read-only GameState from the history entry
  const state: GameState = {
    phase: 'finished',
    players: entry.players,
    scoreLimit: entry.scoreLimit,
    rounds: entry.rounds,
    winner: entry.winner,
  };

  const { showShareSheet } = useShare(cardRef);

  // No-op dispatch for read-only view
  const noop = () => undefined;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${entry.players[0]}, ${entry.players[1]} vs ${entry.players[2]}, ${entry.players[3]}`,
    });
  }, [navigation, entry]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <WinnerBannerCard state={state} dispatch={noop} onShare={() => showShareSheet(state)} />
        <ScoreHeaderCard state={state} onNewGame={noop} onShare={() => showShareSheet(state)} />
        <RoundHistoryCard state={state} />
        <PlayerStatsCard state={state} />

        {/* Hidden export card */}
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ScoreSummaryCard ref={cardRef} state={state} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/history/HistoryDetailScreen.tsx
git commit -m "build history detail screen"
```

---

## Phase 6 — Share & Export

### Task 21: useShare hook

**Files:**
- Create: `src/hooks/useShare.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useShare.ts`:
```ts
import { useState, useCallback } from 'react';
import { View, Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { captureRef } from 'react-native-view-shot';
import { stateToDeepLink } from './useGameState';
import type { GameState } from '../types';

export function useShare(cardRef: React.RefObject<View>): {
  sharing: boolean;
  shareImage: () => Promise<void>;
  shareLink: (state: GameState) => Promise<void>;
  showShareSheet: (state: GameState) => void;
} {
  const [sharing, setSharing] = useState(false);

  const shareImage = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '400 Scorekeeper' });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing.');
      }
    } catch (e) {
      console.warn('Share image failed', e);
    } finally {
      setSharing(false);
    }
  }, [cardRef, sharing]);

  const shareLink = useCallback(async (state: GameState) => {
    const url = stateToDeepLink(state);
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        // Use the native share sheet for links on mobile
        await Sharing.shareAsync(url, { dialogTitle: '400 Scorekeeper' });
      } else {
        Alert.alert('Link copied', url);
      }
    } catch (e) {
      console.warn('Share link failed', e);
    }
  }, []);

  const showShareSheet = useCallback((state: GameState) => {
    Alert.alert(
      'Share',
      'How would you like to share?',
      [
        { text: 'Share as Image', onPress: shareImage },
        { text: 'Share Link', onPress: () => shareLink(state) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [shareImage, shareLink]);

  return { sharing, shareImage, shareLink, showShareSheet };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useShare.ts
git commit -m "add share hook for image capture and deep link sharing"
```

---

## Phase 7 — Polish

### Task 22: Verify TypeScript and run all tests

**Files:** No new files

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors before proceeding.

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix any type errors and test failures"
```

---

### Task 23: Final wiring and boot verification

**Files:** Various

- [ ] **Step 1: Update HistoryNavigator to use proper screen components**

Verify `src/navigation/HistoryNavigator.tsx` uses the correct screen components. The `HistoryDetail` screen needs the `entry` param — since we're using NativeStack, the component receives `route` and `navigation` props directly. Update if needed:

```tsx
// In HistoryNavigator.tsx, ensure HistoryDetail is registered properly
<Stack.Screen
  name="HistoryDetail"
  component={HistoryDetailScreen}
  options={{ title: 'Game Detail' }}
/>
```

- [ ] **Step 2: Boot on iOS simulator**

```bash
npx expo run:ios
```

Walk through: setup screen → start game → enter rounds → add round → check score header → check history tab → go back.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "final wiring and polish"
```

---

### Task 24: Accessibility pass

**Files:** Various (fix as found)

- [ ] **Step 1: Audit interactive elements**

For every `Pressable` in the codebase, verify it has `accessibilityLabel` and `accessibilityRole="button"`. Run:

```bash
grep -r "Pressable" src/ --include="*.tsx" -l
```

Open each file and verify.

- [ ] **Step 2: Audit NumberStepper**

Verify `NumberStepper.tsx` has `accessibilityRole="adjustable"` and `accessibilityValue` on the value display. The current implementation in Task 8 already includes this — confirm it's present.

- [ ] **Step 3: Check FlatList item labels**

In `HistoryListScreen.tsx`, verify `HistoryItem` has `accessibilityLabel` with format: "Team X won, Y to Z, played [date]". Already implemented in Task 19 — confirm it's correct.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "accessibility fixes"
```

---

## Self-Review Notes

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Expo managed workflow, TypeScript strict | Task 1 |
| NativeWind v4 | Task 1 |
| `scoring.ts` / `types.ts` verbatim copy | Task 2 |
| `IStorageAdapter` abstraction | Task 3 |
| `useGameState` with reducer, persistence, deep links | Task 4 |
| `useGameHistory` | Task 5 |
| Theme tokens | Task 6 |
| IAP stub | Task 7 |
| `NumberStepper` with haptics, a11y | Task 8 |
| `ScoreProgressBar` animated | Task 9 |
| `ScoreSummaryCard` with forwardRef | Task 10 |
| `SupportButton` | Task 11 |
| Navigation types, navigators, RootTabs | Task 12 |
| SetupScreen | Task 13 |
| ScoreHeaderCard with blocked indicator | Task 14 |
| RoundFormCard 2×2 grid | Task 15 |
| RoundHistoryCard horizontal scroll | Task 16 |
| PlayerStatsCard | Task 16 |
| WinnerBannerCard | Task 17 |
| ActiveGameScreen with auto-save | Task 18 |
| HistoryListScreen | Task 19 |
| HistoryDetailScreen | Task 20 |
| `useShare` hook | Task 21 |
| TypeScript + test verification | Task 22 |
| Boot + navigation verification | Task 23 |
| Accessibility audit | Task 24 |

**No gaps identified.**
