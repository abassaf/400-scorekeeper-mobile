# 400 Scorekeeper — Mobile App Design

**Date:** 2026-04-05  
**Status:** Approved

---

## Overview

A React Native / Expo port of the existing [400 Scorekeeper web app](../../../400-scorekeeper). Tracks scores for the 400 card game — two teams of two players, configurable score limit, per-round entry with a call/obtain model.

The web app's `scoring.ts` and `types.ts` are the authoritative source of truth and are copied verbatim into the mobile repo. They are never modified.

---

## Tech Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | Expo managed workflow, local builds (`npx expo run:ios/android`) | No EAS required; simpler CI story |
| Language | TypeScript strict mode | Matches web app; shared types |
| Styling | NativeWind v4 | Same utility-class mental model as Tailwind CSS in web |
| Navigation | React Navigation v7, Bottom Tabs + Native Stack | Industry standard; typed param lists |
| State | `useReducer` (direct port of web reducer) | Same `GameState` / `GameAction` types; only storage layer differs |
| Storage | AsyncStorage behind `IStorageAdapter` interface | MMKV-ready; swap is a single file |
| Sharing | `react-native-view-shot` + `expo-sharing` (image) + deep link URL | Parity with web export and URL share |
| Haptics | `expo-haptics` | On round submit, undo, win, stepper press |
| Inputs | Custom `NumberStepper` component | Native UX; replaces HTML `<input type="number">` |
| Icons | `@expo/vector-icons` (Ionicons set) | Bundled with Expo |
| IAP | `react-native-iap` installed, gated behind `ENABLE_IAP = false` | Free at launch; stub ready to activate |

---

## Architecture

### Source of Truth Files

`src/types.ts` and `src/scoring.ts` — copied verbatim from the web app. **Never modify.** All game logic flows from these.

### Navigation Tree

```
NavigationContainer (dark theme)
└── RootTabs (Bottom Tab Navigator)
    ├── GameTab → GameNavigator (Native Stack)
    │   └── Game screen (SetupScreen | ActiveGameScreen, conditional on phase)
    └── HistoryTab → HistoryNavigator (Native Stack)
        ├── HistoryList screen
        └── HistoryDetail screen (receives HistoryEntry via route.params)
```

### State Layer

- `useGameState` — `useReducer` + AsyncStorage persistence. Handles inbound deep links (cold and warm start). Dispatches: `START_GAME`, `ADD_ROUND`, `UNDO_ROUND`, `NEW_GAME`, `KEEP_PLAYING`, `LOAD_STATE`.
- `useGameHistory` — separate hook managing the list of completed `HistoryEntry` objects in AsyncStorage.

### Storage Abstraction

```
IStorageAdapter (interface)
└── AsyncStorageAdapter (implementation)
    └── src/storage/index.ts (singleton export)
```

Only `AsyncStorageAdapter` imports from `@react-native-async-storage/async-storage`. All hooks import from `src/storage/index.ts`.

### Share / Export

- **Image:** `captureRef` (react-native-view-shot) → `expo-sharing`
- **Deep link:** `base64(JSON.stringify(state))` encoded into `fourhundredscorekeeper://?state=<encoded>`
- `useShare` hook exposes `shareImage()`, `shareLink()`, `showShareSheet()`
- Inbound links handled in `useGameState` — prompts user before overwriting an active game

---

## Component Inventory

### Shared Components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `NumberStepper` | Native stepper replacing `<input type="number">`; min/max enforced; haptics on press; min 44×44pt tap target |
| `ScoreProgressBar` | Thin animated bar; emerald fill clamped 0–100% |
| `ScoreSummaryCard` | Ref-capturable export card; fixed 340px width; receives `GameState` |
| `SupportButton` | "Support the Dev ☕" button; no-op when `ENABLE_IAP = false` |

### Game Screens (`src/screens/game/`)

| Screen / Card | Purpose |
|---------------|---------|
| `SetupScreen` | Player names + score limit; `KeyboardAvoidingView`; haptic on submit |
| `ActiveGameScreen` | Orchestrates all game cards; renders based on `phase` |
| `ScoreHeaderCard` | Running totals + progress bars for both teams |
| `RoundFormCard` | 2×2 `NumberStepper` grid; submit + undo |
| `RoundHistoryCard` | Horizontally scrollable round table |
| `PlayerStatsCard` | Per-player make rate / avg called / avg obtained |
| `WinnerBannerCard` | Winner announcement + new game / keep playing / share actions |

### History Screens (`src/screens/history/`)

| Screen | Purpose |
|--------|---------|
| `HistoryListScreen` | `FlatList` of completed games; long-press to delete; pull-to-refresh; Clear All |
| `HistoryDetailScreen` | Read-only replay; share button; receives `HistoryEntry` via nav params |

---

## Data Models

```ts
// From src/types.ts (verbatim from web — never modify)
type PlayerIndex = 0 | 1 | 2 | 3;
interface PlayerEntry { called: number; obtained: number; }
interface Round { id: number; entries: [PE, PE, PE, PE]; teamAScore: number; teamBScore: number; }
interface GameState { phase: "setup"|"playing"|"finished"; players: [s,s,s,s]; scoreLimit: number; rounds: Round[]; winner: "A"|"B"|null; }

// Mobile-only addition
interface HistoryEntry {
  id: string;           // uuid
  completedAt: number;  // Date.now()
  players: [string, string, string, string];
  scoreLimit: number;
  rounds: Round[];
  winner: "A" | "B";
}
```

---

## Theme

All colors from `src/theme.ts` — no hardcoded hex in component files.

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#09090b` | App background |
| `card` | `#18181b` | Card backgrounds, tab bar |
| `border` | `#27272a` | Tab bar border, dividers |
| `accent` | `#10b981` | Active tab, progress bars, buttons |
| `danger` | `#f87171` | Negative scores |
| `textPrimary` | `#ffffff` | Primary text |
| `textSecondary` | `#a1a1aa` | Labels |

---

## Phase Plan

### Phase 0 — Foundation & Scaffold
Working Expo app boots, navigation shell renders two tabs, NativeWind applies styles.

### Wave A (Phases 1–3, parallel)

- **Phase 1 — Game Logic & Storage:** `IStorageAdapter`, `AsyncStorageAdapter`, `useGameState`, `useGameHistory`, deep link handling, full unit tests.
- **Phase 2 — Design System & Shared Components:** `theme.ts`, `NumberStepper`, `ScoreProgressBar`, `ScoreSummaryCard`, `SupportButton`, IAP stub.
- **Phase 3 — Navigation Architecture:** Typed param lists, `GameNavigator`, `HistoryNavigator`, `RootTabs`, `App.tsx` with dark `NavigationContainer` theme.

### Wave B (Phases 4–6, parallel; requires Wave A complete)

- **Phase 4 — Game Tab Screens:** Full active game flow — setup, round entry, score header, round history, player stats, winner banner.
- **Phase 5 — History Tab Screens:** Game history list with delete/clear, detail view with read-only replay.
- **Phase 6 — Share & Export:** `useShare` hook, image capture, deep link encode/decode, action sheet.

### Phase 7 — Polish (sequential, after Wave B)
IAP stub finalisation, app icon + splash, haptic audit, accessibility audit, App Store compliance checklist, 10-area Codex review.

---

## Coding Conventions

- All colors via `theme.ts` tokens — no hardcoded hex in components
- `className` (NativeWind) preferred over inline `style` objects
- Every interactive element has `accessibilityLabel` + `accessibilityRole`
- Platform branches use `Platform.OS === 'ios'` — no `.ios.ts` platform files unless necessary
- Haptics wrapped: `if (Platform.OS !== 'web') { await Haptics.impactAsync(...) }` inside try/catch
- Async ops in hooks wrapped in try/catch; errors logged with `console.warn`, never thrown to UI
- No `any` types
- `scoring.ts` and `types.ts` must never be modified

---

## Acceptance Criteria (top-level)

- App boots on iOS simulator and Android emulator with no errors
- All 7 phases complete with their individual acceptance criteria met
- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- No browser API leakage (`window.`, `localStorage.`, `document.`, etc.)
- Phase 7 Codex review returns **READY** or **CONDITIONAL** (no P0/P1 blockers)

---

## Out of Scope

- EAS / cloud builds
- iPad / tablet layout (portrait iPhone only)
- Push notifications
- Online multiplayer / sync
- App Store submission (bundle ID placeholder `com.PLACEHOLDER` must be replaced by developer)
