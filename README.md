# 400 Scorekeeper — Mobile

A native mobile scorekeeper for **400**, a Lebanese card game. Tracks bids, rounds won, running totals, and player stats across rounds — now with persistent game history, haptic feedback, and share/export.

This is a port of [400 Scorekeeper](https://github.com/abassaf/400-scorekeeper) (a Vite + React web app) to React Native / Expo, with added mobile-native features.

---

## The game

400 is played with 4 players split into two teams (Team A and Team B). Each hand is won by the highest card played, with one exception: if a player has run out of the suit led, they may play a heart, which beats any non-heart card in that hand.

Each round, every player declares a bid (how many hands they think they'll win), then plays. Scoring rewards ambitious, accurate bids and punishes misses:

| Bid | Score if made |
|-----|--------------|
| 1–4 | Equal to bid |
| 5   | 10 |
| 6   | 12 |
| 7   | 14 |
| 8   | 16 |
| 9   | 27 |
| 10  | 40 |
| 11  | 44 |
| 12  | 48 |
| 13  | 52 |

If you miss your bid, you lose points equal to your bid. The first team whose running total reaches or exceeds the score limit wins — but only if every player on that team has a non-negative individual score.

## Features

- Enter player names and a custom score limit (default 80)
- Native number steppers for bid and hands won — no keyboard required
- Live feedback on the total hands entered per round
- Running totals with animated progress bars toward the score limit
- "Blocked" indicator when a team hits the limit but a player is individually negative
- Full round history table with per-player results and cumulative scores
- Per-player stats: make rate, average bid, average won
- Winner detection with options to start a new game or keep playing
- Game state persisted across app restarts via AsyncStorage
- Haptic feedback on round submit, undo, win, and stepper presses
- **History tab** — scrollable list of completed games with long-press to delete
- **Share as image** — captures a summary card and opens the native share sheet
- **Share as link** — encodes game state into a deep link (`fourhundredscorekeeper://`) that opens the app and loads the shared game

## Running locally

Requires [Node.js](https://nodejs.org), [pnpm](https://pnpm.io), [Expo CLI](https://docs.expo.dev/get-started/installation/), and either an iOS simulator or Android emulator.

```bash
pnpm install
pnpm expo run:ios      # iOS simulator
pnpm expo run:android  # Android emulator
```

> **Note:** Replace `com.PLACEHOLDER` in `app.json` with your actual bundle identifier before building for distribution.

## Tech stack

- [Expo](https://expo.dev) managed workflow (local builds, no EAS required)
- [React Native](https://reactnative.dev) + TypeScript (strict)
- [NativeWind v4](https://www.nativewind.dev) — Tailwind CSS utility classes for React Native
- [React Navigation v7](https://reactnavigation.org) — bottom tabs + native stack
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) behind an `IStorageAdapter` interface (MMKV-ready)
- [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) for tactile feedback
- [react-native-view-shot](https://github.com/gre/react-native-view-shot) + [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) for image export
- [expo-linking](https://docs.expo.dev/versions/latest/sdk/linking/) for deep link share/receive

## Project notes

This project is both a personal app and a **technical demonstration of using [Claude Code](https://claude.ai/code) to convert a Vite + TypeScript web app into a React Native mobile app with additional functionality**.

The web app's core scoring logic (`src/types.ts` and `src/scoring.ts`) is copied verbatim — no modifications. All mobile-specific concerns (navigation, storage, haptics, share, history) were built on top of that shared foundation.

The conversion was done entirely through Claude Code, from scaffolding through to a working app: dependencies, navigation wiring, component ports, storage abstraction, share/export, and tests — with human review at each phase.

## License

MIT. See [LICENSE](LICENSE).
