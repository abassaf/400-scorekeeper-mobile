# 400 Scorekeeper - Mobile

A native mobile scorekeeper for **400**, a Lebanese card game. Tracks bids, rounds won, running totals, and player stats across rounds - with persistent game history, haptic feedback, and share/export.

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
- Live bid validation: minimum 2 per player, total bids must reach 11
- Running totals with progress bars toward the score limit
- "Blocked" indicator when a team hits the limit but a player is individually negative
- Full round history table with per-player results and cumulative scores
- Per-player stats: make rate, average bid, average won
- Winner detection with options to start a new game or keep playing
- Game state persisted across app restarts via AsyncStorage
- Haptic feedback on round submit, undo, win, and stepper presses
- **History tab** — scrollable list of completed games with long-press to delete
- **Share as image** — captures a summary card and opens the native share sheet
- **Share as link** — encodes game state into a deep link that opens the app and loads the shared game

---

## Getting started on a new machine

### Quick path

```bash
bash scripts/setup.sh
```

The script is idempotent — safe to re-run. It handles everything listed below automatically.

### What it installs

| Tool | Purpose |
|------|---------|
| Homebrew | Package manager |
| Node 20 (via nvm) | JS runtime |
| pnpm | Package manager for this repo |
| rbenv + Ruby 3.3.0 | Required by Fastlane |
| CocoaPods | iOS native dependency manager |
| Fastlane | App Store / Play Store publishing |
| JDK 17 | Android builds |
| Watchman | React Native file watcher |

Xcode and Android Studio must be installed manually before running the script (see below).

### Manual prerequisites

**Xcode** (iOS)
1. Install from the Mac App Store
2. Open it once to accept the license, or run `sudo xcodebuild -license accept`
3. Install command line tools: `xcode-select --install`

**Android Studio** (Android)
1. Download from [developer.android.com/studio](https://developer.android.ane.com/studio)
2. Open Android Studio → SDK Manager → install:
   - Android SDK Platform 35
   - Android SDK Build-Tools 35.0.0
   - Android SDK Command-line Tools

---

## Secrets setup

All secrets live at `~/.fastlane/api_keys/` on the machine. This directory is never committed.

```
~/.fastlane/api_keys/
├── AuthKey_XXXXXXXXXX.p8     ← App Store Connect API key
├── 400scorekeeper.keystore   ← Android signing keystore
└── play-store-key.json       ← Google Play service account JSON
```

The project also needs a `fastlane/.env` file (gitignored). Copy the template and fill in your values:

```bash
cp fastlane/.env.example fastlane/.env
# edit fastlane/.env with your credentials
```

**App Store Connect API key** — [App Store Connect → Users & Access → Integrations → API Keys](https://appstoreconnect.apple.com/access/integrations/api)

**Android keystore** — Your existing `.keystore` / `.jks` file from when the app was first signed.

**Google Play JSON key** — [Google Play Console → Setup → API access → Service accounts](https://play.google.com/console) → create a service account → download the JSON key.

**Match certs repo** — A private Git repo you control, referenced in `MATCH_GIT_URL`. The script checks SSH access to GitHub; make sure your SSH key is added at [github.com/settings/keys](https://github.com/settings/keys).

> **Note:** The Android keystore is automatically copied from `~/.fastlane/api_keys/` to `android/` at the start of every `fastlane android release` run, because `expo prebuild --clean` wipes the `android/` directory.

---

## Local development

```bash
pnpm install
pnpm expo prebuild --clean   # generates ios/ and android/ (both gitignored)
cd ios && pod install && cd ..

pnpm expo run:ios            # iOS simulator
pnpm expo run:android        # Android emulator
```

Or just run `bash scripts/setup.sh` — it does all of the above.

---

## Tests

```bash
pnpm test
```

---

## Publishing to stores

Both lanes read credentials from `fastlane/.env`. Run from the repo root.

### iOS → App Store

```bash
# First time on a new machine: sync signing certificates
fastlane ios certs

# Build and upload to App Store Connect (TestFlight)
fastlane ios release
```

The iOS lane:
1. Fetches distribution certificates via Match (from your private certs repo)
2. Sets code signing on the Xcode project
3. Increments the build number
4. Builds a Release `.ipa`
5. Uploads to App Store Connect

### Android → Google Play

```bash
fastlane android release
```

The Android lane:
1. Copies the keystore from `~/.fastlane/api_keys/` into `android/`
2. Builds a signed release `.aab`
3. Uploads to the **internal** track on Google Play

To promote from internal to a wider track, use the Google Play Console.

---

## Tech stack

- [Expo](https://expo.dev) bare workflow (local builds, no EAS required)
- [React Native 0.81](https://reactnative.dev) + TypeScript (strict), Hermes engine, New Architecture enabled
- [NativeWind v4](https://www.nativewind.dev) — Tailwind CSS utility classes for React Native
- [React Navigation v7](https://reactnavigation.org) — bottom tabs + native stack
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) behind an `IStorageAdapter` interface (MMKV-ready)
- [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) for tactile feedback
- [@shopify/react-native-skia](https://shopify.github.io/react-native-skia/) for share image rendering
- [react-native-view-shot](https://github.com/gre/react-native-view-shot) + [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) for image export
- [expo-linking](https://docs.expo.dev/versions/latest/sdk/linking/) for deep link share/receive
- [Fastlane](https://fastlane.tools) for App Store and Google Play publishing

---

## Project structure

```
src/
  scoring.ts          — pure scoring logic (shared with web version)
  types.ts            — shared types
  hooks/
    gameReducer.ts    — all game state transitions
    useGameState.ts   — state hook
    useGameHistory.ts — completed game history
  screens/game/       — active game UI
  screens/history/    — history tab UI
  components/         — shared UI components
  storage/            — IStorageAdapter + AsyncStorage implementation
fastlane/
  Fastfile            — iOS and Android lanes
  .env.example        — environment variable template (copy to .env)
scripts/
  setup.sh            — machine bootstrap script
```

---

## License

MIT. See [LICENSE](LICENSE).
