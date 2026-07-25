# Plan — Discord feedback triage (2026-07-25)

Three reports, two workstreams. Reports 1 & 2 are the same Android root cause; report 3
is a rules change that must land in **both** `400-scorekeeper-mobile` and `400-scorekeeper`.

---

## A. "This screen is not scrollable" + "Keyboard hides input field" (mobile only)

Both came from the same device (CPH2625, Android 15) minutes apart. Both were typed *into
the feedback form* on the Settings screen — which is exactly the screen that breaks.

**Root cause:** `app.json:25` sets `"edgeToEdgeEnabled": true`. Under Expo SDK 54 edge-to-edge
the window no longer resizes for the IME the way plain `adjustResize` did, so any screen
without an explicit `KeyboardAvoidingView` loses the area under the keyboard — the content
below is unreachable *and* the ScrollView gains no scrollable height, which reads to a user
as "not scrollable".

Expo SDK 54 keyboard guide prescribes `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`
— on Android, merely *having* the KAV mounted is the fix; `behavior="height"` is the broken
combination. (Source: expo/expo sdk-54 `docs/pages/guides/keyboard-handling.mdx`.)

### A1. `src/screens/settings/SettingsScreen.tsx` — the reported screen
- Line 2: add `KeyboardAvoidingView` to the RN import (`Platform` is already imported, unused for this).
- Wrap the `ScrollView` (line 65) in `<KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>`.
- Add `paddingBottom: 48` to `contentContainerStyle` and `keyboardDismissMode="on-drag"` so
  the Send button clears the IME and a swipe dismisses it.
- `keyboardShouldPersistTaps="handled"` is already there — keep it.

### A2. `src/screens/game/SetupScreen.tsx:58-61` — same class of bug, latent
Has a KAV but uses the known-broken `behavior="height"` on Android. Change to `undefined`.
Affects the Score Limit input and the Start button.

### A3. `src/components/EditRoundModal.tsx:63-77` — genuinely non-scrollable
Independent of the keyboard: an absolutely-positioned sheet at `bottom: 0` holding 8
`NumberStepper`s + a multiline comment `TextInput` + Save, with no ScrollView. On a short
screen the title/Cancel row overflows off the top with no way to reach it.
- Drop `position:'absolute'/bottom/left/right` — the parent already does `justifyContent:'flex-end'`.
- Add `maxHeight: '90%'` to the sheet and move the body (lines 85-148) into a `ScrollView`
  with `keyboardShouldPersistTaps="handled"`.
- Wrap in a `KeyboardAvoidingView` *inside* the `Modal` — RN `Modal` is its own window and
  does not inherit the host's soft-input handling. Also set `statusBarTranslucent` and
  `navigationBarTranslucent` on the `Modal` so it matches edge-to-edge.

### Not doing
- **No** `react-native-keyboard-controller`. Core `KeyboardAvoidingView` covers all three
  cases; add the library only if manual testing shows the multiline inputs still misbehave.
- **No** `android.softwareKeyboardLayoutMode: "pan"` — that's the fix for tab bars being
  pushed up, and `RootTabs.tsx:25` already sets `tabBarHideOnKeyboard: true`. Switching to
  `pan` would *remove* the window resize that A1/A2 depend on.

### Verification
No unit test can catch this. Manual on an Android device/emulator (edge-to-edge, API 35):
Settings → focus email field → Send button must stay visible and the page must still scroll;
Setup → focus Score Limit; Active game → Edit Round → sheet scrolls, comment field visible
with keyboard up.

---

## B. Doubles penalty should match the doubles score (BOTH repos)

> "if you call 5 you'll get 10 points but if you don't make 5 you should lose 10 points not 5"

Today `playerScore` awards from `SCORE_TABLE` on a make but penalises the raw bid on a miss:

```ts
// scoring.ts:9-11 — byte-identical in both repos
export function playerScore(called: number, obtained: number): number {
  return obtained >= called ? (SCORE_TABLE[called] ?? called) : -called;
}
```

Bids 2-4 are unaffected either way (face value). Only 5+ changes: −5→−10, −9→−27, −13→−52.

Shipping as a **per-game setting**, not a flat rule change, so existing/saved games keep
their scores and both house rules are supported.

### B1. Thread the flag (do this identically in both repos)

`src/types.ts` — add to `GameState`:
```ts
harshDoubles?: boolean;   // miss costs the SCORE_TABLE value, not the raw bid
```
Optional so games already in `localStorage`/`AsyncStorage`, in saved history, and in
existing deep links deserialise unchanged and read as `false`.

`src/scoring.ts` — make the parameter **required** on the four scoring functions:
```ts
export function playerScore(called: number, obtained: number, harshDoubles: boolean): number {
  const value = SCORE_TABLE[called] ?? called;
  return obtained >= called ? value : -(harshDoubles ? value : called);
}
```
plus `calcRound(entries, harshDoubles)`, `playerCumulativeScore(rounds, i, harshDoubles)`.
`runningTotals`/`playerStats` need no change (they read stored snapshots / raw entries).

Required, not defaulted: `tsc --noEmit` then enumerates every call site, which *is* the
checklist. Known consumers to update — all already have the game state or a saved
`GameState` in hand, so it is a prop-drill of one boolean, no new context:
- mobile: `hooks/gameReducer.ts:54,113,177` (incl. `canWin`), `screens/game/ScoreSummaryCard.tsx:33-34,150`,
  `PlayerStatsCard.tsx`, `ScoreHeaderCard.tsx`, `WinnerBannerCard.tsx`,
  `screens/history/HistoryListScreen.tsx:19`, `HistoryDetailScreen.tsx`, `utils/generateShareImage.ts:114-115,323`
- web: `hooks/useGameState.ts:33-47 (canWin), 49-64 (resolveWinner), 88-93`, plus the
  equivalent display components and the `html-to-image` share card

### B2. Setup-screen toggle
Add a switch to `SetupScreen` (mobile) and the setup form (web), label:
**"Harsh doubles — a missed bid of 5+ costs its full value"**, default **off**.
Pass through `START_GAME` (`gameReducer.ts:94-103` / `useGameState.ts`).

**Locked once the game starts.** `Round.teamAScore/teamBScore` are persisted snapshots
(`gameReducer.ts:115-120`); flipping mid-game would leave stored team totals disagreeing
with recomputed per-player totals. No mid-game edit, no Settings-level default (YAGNI).

### B3. Tests
`__tests__/scoring.test.ts` (mobile only — web has no test runner) — add:
- `playerScore(5, 5, true) === 10` / `playerScore(5, 4, true) === -10`
- `playerScore(5, 4, false) === -5` (regression guard on the default)
- `playerScore(3, 2, true) === -3` (bids under 5 identical under both rules)
- one `calcRound` case under `harshDoubles: true`

---

## C. De-duplicate `scoring.ts` across the two repos

Verified today: `diff src/scoring.ts ../400-scorekeeper/src/scoring.ts` → **identical**.
`types.ts` differs by a single trailing comment. Only the mobile copy has tests. B is the
second rule change that would have to be applied twice, so this lands **first** — then the
`harshDoubles` rule gets written exactly once.

### Mechanism: git subtree
A new repo `abassaf/400-scorekeeper-scoring`, mounted at `src/shared/` in both consumers.

Chosen because it needs nothing that isn't already installed: no registry, no publish step
on every rule change, and the files land as ordinary first-party source, so Metro and Vite
both compile them with no config. Rejected alternatives:
- **npm package** — a publish + version-bump on every rule tweak, plus the known sharp edges
  of shipping raw TS into `node_modules` for Metro and for Vite's esbuild pre-bundle.
- **git submodule** — same benefit, worse ergonomics: an init step that's easy to forget,
  detached HEAD, `--recursive` needed in EAS/CI checkouts.
- **pnpm workspace / `file:` link** — the two repos aren't in one workspace, and a local
  path dep breaks EAS builds, which only see the mobile repo.

### C1. Create the shared repo
Contents (three files, no `package.json`, no build):
- `scoring.ts` — copied verbatim from either repo
- `types.ts` — copied, dropping the mobile-only `// adjusted score this round` comment
- `scoring.test.ts` — moved from `400-scorekeeper-mobile/__tests__/scoring.test.ts`
- `README.md` — the two subtree commands, so future-you doesn't have to look them up

### C2. Mount in both repos
```
git remote add shared git@github.com:abassaf/400-scorekeeper-scoring.git
git subtree add --prefix src/shared shared main --squash
```
Then delete the local `src/scoring.ts` / `src/types.ts` bodies and replace each with a
one-line barrel:
```ts
export * from './shared/scoring';   // src/scoring.ts
export * from './shared/types';     // src/types.ts
```
This is the point of the barrels: **zero import changes** in the ~15 consumer files per
repo, and any future move of the shared dir stays free. Two one-line files beats rewriting
30 import paths.

Add to both `package.json`s so the flags never have to be recalled:
```json
"scoring:pull": "git subtree pull --prefix src/shared shared main --squash",
"scoring:push": "git subtree push --prefix src/shared shared main"
```

### C3. Wire up the tests
- **Mobile:** jest has no `testMatch` override, so the default glob picks up
  `src/shared/scoring.test.ts` automatically. Delete `__tests__/scoring.test.ts` (it moved).
  Also add the missing `"test": "jest"` script — `package.json` has a `jest` block but no
  script today.
- **Web:** *no test runner, and it doesn't need one.* With a subtree there is only one copy
  of the code, and the mobile repo tests it. Adding vitest here would buy nothing.
  One required fix: `tsc -b` would now typecheck the test file and fail on missing jest
  globals — add `"exclude": ["src/shared/*.test.ts"]` to the web `tsconfig`.

### C4. Verify the mount is real
Before moving on to B: change a value in `src/shared/scoring.ts` in the mobile repo, push
and pull it through to the web repo, confirm `npm run build` still passes there, then revert.
Proving the round-trip works is cheaper now than discovering it's broken mid-rule-change.

### Ceiling
Subtree pull is manual — nothing stops the two mounts sitting at different commits for a
while. Acceptable for a solo dev on two repos; if it ever bites, the upgrade path is a CI
check that fails when `src/shared` doesn't match the shared repo's `main`.

---

## Suggested order
1. **A1** (the reported screen) — smallest, highest-signal, ship it alone.
2. **A2 + A3** — same session, same manual test pass.
3. **C** — extraction and round-trip verification, no behaviour change.
4. **B** — now a single edit inside `src/shared/scoring.ts`, plus the per-repo setup toggle
   and call-site threading (which stays duplicated: the UI isn't shared).
