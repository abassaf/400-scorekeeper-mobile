# Import Game Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to manually import a shared game-state link via a paste field in both the SetupScreen and SettingsScreen, with clipboard auto-detection on mount and a conflict-resolution dialog when a game is already in progress.

**Architecture:** A new `useImportLink` hook centralizes all import logic — clipboard detection, URL parsing, validation, and the conflict-resolution Alert. Both SetupScreen and SettingsScreen call this hook; neither duplicates the logic. The existing automatic deep-link handling in `useGameState` (cold/warm start via `Linking`) is left untouched.

**Tech Stack:** React Native, Expo Clipboard (`expo-clipboard`), existing `isValidState` + `LOAD_STATE` dispatch, `useGameHistory.saveGame`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/context/GameContext.tsx` | React context providing `state` + `dispatch` app-wide |
| Create | `src/hooks/useImportLink.ts` | Clipboard detection, URL parsing, conflict dialog, dispatch |
| Modify | `src/navigation/GameNavigator.tsx` | Provide `GameContext` from `useGameState()` |
| Modify | `src/screens/game/SetupScreen.tsx` | Add import card below Start button |
| Modify | `src/screens/settings/SettingsScreen.tsx` | Consume `GameContext`, add import card |
| Modify | `app.json` | Add `expo-clipboard` plugin if needed |

> **Why GameContext?** `SettingsNavigator` renders `SettingsScreen` via `component={SettingsScreen}` — React Navigation doesn't support passing custom props through `component`. A context is the idiomatic solution; `GameNavigator` already calls `useGameState()` and can provide it.

---

### Task 1: Create `GameContext`

**Files:**
- Create: `src/context/GameContext.tsx`
- Modify: `src/navigation/GameNavigator.tsx`

`SettingsScreen` cannot receive props via React Navigation's `component` prop. A context is the standard solution — `GameNavigator` already owns `useGameState()` and can wrap its subtree with the provider. `RootTabs` wraps all navigators, so wrapping at `GameNavigator` level is sufficient if we wrap the entire `<Tab.Navigator>` — but actually `RootTabs` renders all three tab navigators, so the context provider must wrap `RootTabs` itself or be placed in `App.tsx`. We'll place it in `GameNavigator` wrapping the `<Stack.Navigator>` won't reach `SettingsNavigator`. Instead, `GameNavigator` will call `useGameState()` and provide context, and `App.tsx` (or wherever `RootTabs` is rendered) will wrap with the provider.

Read `App.tsx` to understand the root render tree before modifying.

- [ ] **Step 1: Read App.tsx to understand root structure**

```bash
cat App.tsx
```

- [ ] **Step 2: Create `src/context/GameContext.tsx`**

```tsx
import React, { createContext, useContext } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../hooks/gameReducer';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  state,
  dispatch,
  children,
}: GameContextValue & { children: React.ReactNode }) {
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
```

- [ ] **Step 3: Provide context from `GameNavigator.tsx`**

`GameNavigator` already calls `useGameState()`. Wrap the returned JSX with `<GameProvider>`:

Replace the current `GameNavigator` export in `src/navigation/GameNavigator.tsx`:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { GameStackParamList } from './types';
import { SetupScreen } from '../screens/game/SetupScreen';
import { ActiveGameScreen } from '../screens/game/ActiveGameScreen';
import { useGameState } from '../hooks/useGameState';
import { GameProvider } from '../context/GameContext';
import type { GameState } from '../types';

const Stack = createNativeStackNavigator<GameStackParamList>();

function GameScreen() {
  const { state, dispatch } = useGameState();
  const route = useRoute<RouteProp<GameStackParamList, 'Game'>>();

  React.useEffect(() => {
    const entry = route.params?.loadEntry;
    if (!entry) return;
    const loadedState: GameState = {
      phase: entry.winner ? 'finished' : 'playing',
      players: entry.players,
      scoreLimit: entry.scoreLimit,
      rounds: entry.rounds,
      winner: entry.winner,
    };
    dispatch({ type: 'LOAD_STATE', state: loadedState });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.loadEntry]);

  return state.phase === 'setup' ? (
    <SetupScreen state={state} dispatch={dispatch} />
  ) : (
    <ActiveGameScreen state={state} dispatch={dispatch} />
  );
}

function GameScreenWithProvider() {
  const { state, dispatch } = useGameState();
  return (
    <GameProvider state={state} dispatch={dispatch}>
      <GameScreen />
    </GameProvider>
  );
}
```

Wait — `GameScreen` and `GameScreenWithProvider` would both call `useGameState()`, creating two separate stores. Instead, `useGameState` must be called once and shared. The correct structure:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { GameStackParamList } from './types';
import { SetupScreen } from '../screens/game/SetupScreen';
import { ActiveGameScreen } from '../screens/game/ActiveGameScreen';
import { useGameState } from '../hooks/useGameState';
import { GameProvider } from '../context/GameContext';
import type { GameState } from '../types';

const Stack = createNativeStackNavigator<GameStackParamList>();

function GameScreen() {
  const { state, dispatch } = useGameState();
  const route = useRoute<RouteProp<GameStackParamList, 'Game'>>();

  React.useEffect(() => {
    const entry = route.params?.loadEntry;
    if (!entry) return;
    const loadedState: GameState = {
      phase: entry.winner ? 'finished' : 'playing',
      players: entry.players,
      scoreLimit: entry.scoreLimit,
      rounds: entry.rounds,
      winner: entry.winner,
    };
    dispatch({ type: 'LOAD_STATE', state: loadedState });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.loadEntry]);

  const screen = state.phase === 'setup' ? (
    <SetupScreen state={state} dispatch={dispatch} />
  ) : (
    <ActiveGameScreen state={state} dispatch={dispatch} />
  );

  return (
    <GameProvider state={state} dispatch={dispatch}>
      {screen}
    </GameProvider>
  );
}

export function GameNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Game" component={GameScreen} />
    </Stack.Navigator>
  );
}
```

> **Note:** `GameProvider` wraps only the game screen's subtree here. But `SettingsScreen` lives in a separate tab navigator, so it won't have access to this context. To reach `SettingsScreen`, the provider must wrap `RootTabs`. Read `App.tsx` in Step 1 to find the right place to hoist the provider. The pattern will be: call `useGameState()` in `App.tsx` (or a root wrapper), provide context at the top, then `GameNavigator` and `SettingsNavigator` both consume it. `GameNavigator` no longer needs to call `useGameState()` itself — it consumes `useGameContext()` instead.

**Revised approach (after reading App.tsx):**

1. Call `useGameState()` in App.tsx (or top-level component).
2. Wrap `<RootTabs />` with `<GameProvider state={state} dispatch={dispatch}>`.
3. `GameNavigator`'s `GameScreen` uses `useGameContext()` instead of `useGameState()`.
4. `SettingsScreen` uses `useGameContext()`.

Apply this after reading App.tsx in Step 1.

- [ ] **Step 4: Commit**

```bash
git add src/context/GameContext.tsx src/navigation/GameNavigator.tsx
git commit -m "feat: add GameContext and provide game state app-wide"
```

---

### Task 2: Add `expo-clipboard` dependency


**Files:**
- Modify: `package.json` (dependency)
- Modify: `app.json` (plugin if required)

- [ ] **Step 1: Install expo-clipboard**

```bash
npx expo install expo-clipboard
```

Expected output: package added, no errors.

- [ ] **Step 2: Verify import works**

In a scratch check, confirm the package resolves:

```bash
node -e "require('expo-clipboard'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock  # or package-lock.json
git commit -m "chore: add expo-clipboard dependency"
```

---

### Task 3: Add `deepLinkToState` parser to `gameReducer.ts`

**Files:**
- Modify: `src/hooks/gameReducer.ts`

This is a pure function — easy to test in isolation. Add it right below `stateToDeepLink`.

- [ ] **Step 1: Add the function**

Open `src/hooks/gameReducer.ts`. After line 75 (`return \`fourhundredscorekeeper://...\``), add:

```ts
export function deepLinkToState(url: string): GameState | null {
  try {
    const match = url.match(/[?&]state=([^&]*)/);
    if (!match) return null;
    const decoded: unknown = JSON.parse(atob(decodeURIComponent(match[1])));
    return isValidState(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/gameReducer.ts
git commit -m "feat: add deepLinkToState parser to gameReducer"
```

---

### Task 4: Create `useImportLink` hook

**Files:**
- Create: `src/hooks/useImportLink.ts`

This hook encapsulates: clipboard read on mount, state field for the pasted URL, and the import action (with conflict dialog).

- [ ] **Step 1: Create the file**

```ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { deepLinkToState } from './gameReducer';
import type { GameState } from '../types';
import type { GameAction } from './gameReducer';

const SCHEME = 'fourhundredscorekeeper://';

interface UseImportLinkOptions {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  saveGame: (state: GameState) => Promise<string | undefined>;
}

export interface UseImportLinkResult {
  linkText: string;
  setLinkText: (text: string) => void;
  handleImport: () => void;
}

export function useImportLink({ state, dispatch, saveGame }: UseImportLinkOptions): UseImportLinkResult {
  const [linkText, setLinkText] = useState('');

  // Auto-detect a valid game link in the clipboard on mount
  useEffect(() => {
    Clipboard.getStringAsync().then((text) => {
      if (text && text.startsWith(SCHEME) && deepLinkToState(text) !== null) {
        setLinkText(text);
      }
    }).catch(() => undefined);
  }, []);

  const doLoad = useCallback((imported: GameState) => {
    dispatch({ type: 'LOAD_STATE', state: imported });
  }, [dispatch]);

  const handleImport = useCallback(() => {
    const imported = deepLinkToState(linkText.trim());
    if (!imported) {
      Alert.alert('Invalid link', 'This does not appear to be a valid 400 Scorekeeper game link.');
      return;
    }

    const hasActiveGame = state.phase === 'playing' && state.rounds.length > 0;
    if (!hasActiveGame) {
      doLoad(imported);
      setLinkText('');
      return;
    }

    // Conflict: a game is in progress
    Alert.alert(
      'Game in Progress',
      'You have an active game. What would you like to do?',
      [
        {
          text: 'Save & Replace',
          onPress: async () => {
            await saveGame(state);
            doLoad(imported);
            setLinkText('');
          },
        },
        {
          text: 'Replace Without Saving',
          style: 'destructive',
          onPress: () => {
            doLoad(imported);
            setLinkText('');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [linkText, state, doLoad, saveGame]);

  return { linkText, setLinkText, handleImport };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useImportLink.ts
git commit -m "feat: add useImportLink hook with clipboard detection and conflict dialog"
```

---

### Task 5: Add import card to SetupScreen

**Files:**
- Modify: `src/screens/game/SetupScreen.tsx`

Add the import card below the Start button. SetupScreen needs `state`, `dispatch`, and `saveGame` — currently it only receives `state` and `dispatch`, which is sufficient (saveGame comes from `useGameHistory`).

- [ ] **Step 1: Add imports and hook call**

At the top of `SetupScreen.tsx`, add:

```ts
import { useGameHistory } from '../../hooks/useGameHistory';
import { useImportLink } from '../../hooks/useImportLink';
```

Inside the `SetupScreen` component body (after the existing `const { colors } = useTheme();` line), add:

```ts
const { saveGame } = useGameHistory();
const { linkText, setLinkText, handleImport } = useImportLink({ state, dispatch, saveGame });
```

- [ ] **Step 2: Add the import card JSX**

After the closing `</Pressable>` of the Start button (around line 138), add:

```tsx
{/* Import Game Link */}
<View style={{ marginTop: 24 }}>
  <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
    Import Game Link
  </Text>
  <TextInput
    style={[inputStyle, { marginBottom: 10 }]}
    value={linkText}
    onChangeText={setLinkText}
    placeholder="Paste a game link here"
    placeholderTextColor={colors.textSubtle}
    autoCapitalize="none"
    autoCorrect={false}
    returnKeyType="done"
    onSubmitEditing={handleImport}
    accessibilityLabel="Game link input"
  />
  <Pressable
    onPress={handleImport}
    disabled={!linkText.trim()}
    accessibilityLabel="Import game"
    accessibilityRole="button"
    style={{
      backgroundColor: colors.buttonPrimary,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
      opacity: !linkText.trim() ? 0.4 : 1,
    }}
  >
    <Text style={{ color: colors.buttonPrimaryText, fontWeight: '700', fontSize: 15 }}>
      Import Game
    </Text>
  </Pressable>
</View>
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/game/SetupScreen.tsx
git commit -m "feat: add import game link card to SetupScreen"
```

---

### Task 6: Add import card to SettingsScreen

**Files:**
- Modify: `src/screens/settings/SettingsScreen.tsx`

`SettingsScreen` now accesses game state via `useGameContext()` (provided by Task 1). No prop changes are needed to `SettingsNavigator`.

- [ ] **Step 1: Add imports**

At the top of `src/screens/settings/SettingsScreen.tsx`, add:

```ts
import { TextInput, Pressable } from 'react-native'; // add to the existing RN import line if not already there
import { useGameContext } from '../../context/GameContext';
import { useGameHistory } from '../../hooks/useGameHistory';
import { useImportLink } from '../../hooks/useImportLink';
```

- [ ] **Step 2: Wire up the hook**

Inside the `SettingsScreen` component body, after `const { colors } = useTheme();`, add:

```ts
const { state, dispatch } = useGameContext();
const { saveGame } = useGameHistory();
const { linkText, setLinkText, handleImport } = useImportLink({ state, dispatch, saveGame });
```

- [ ] **Step 3: Add the import card JSX**

Inside the `<ScrollView>`, add a new card after the Appearance card (after the closing `</View>` of the appearance card, before the feedback card):

```tsx
{/* Import Game Link card */}
<View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
  <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
    Import Game Link
  </Text>
  <TextInput
    style={{
      backgroundColor: colors.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      padding: 12,
      fontSize: 14,
      marginBottom: 10,
    }}
    value={linkText}
    onChangeText={setLinkText}
    placeholder="Paste a game link here"
    placeholderTextColor={colors.textMuted}
    autoCapitalize="none"
    autoCorrect={false}
    returnKeyType="done"
    onSubmitEditing={handleImport}
    accessibilityLabel="Game link input"
  />
  <Pressable
    onPress={handleImport}
    disabled={!linkText.trim()}
    accessibilityRole="button"
    accessibilityLabel="Import game"
    style={{
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      opacity: !linkText.trim() ? 0.45 : 1,
    }}
  >
    <Text style={{ color: colors.accentText, fontWeight: '700', fontSize: 14 }}>
      Import Game
    </Text>
  </Pressable>
</View>
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/settings/SettingsScreen.tsx
git commit -m "feat: add import game link card to SettingsScreen"
```

---

### Task 7: Smoke test end-to-end

- [ ] **Step 1: Start the dev server**

```bash
npx expo start
```

- [ ] **Step 2: Test SetupScreen clipboard detection**

1. Copy a valid game link (`fourhundredscorekeeper://?state=...`) to clipboard on the simulator.
2. Close and re-open the app (or navigate away and back to Setup).
3. Verify the paste field auto-fills.
4. Tap "Import Game" — verify the game loads correctly.

- [ ] **Step 3: Test conflict dialog**

1. Start a game and add at least one round.
2. Navigate to Settings, paste a valid game link.
3. Tap "Import Game".
4. Verify the conflict dialog appears with "Save & Replace", "Replace Without Saving", and "Cancel".
5. Test each option:
   - "Save & Replace" → game appears in history, imported game loads.
   - "Replace Without Saving" → imported game loads, original not in history.
   - "Cancel" → current game unchanged.

- [ ] **Step 4: Test invalid link**

Paste a random string and tap Import — verify the "Invalid link" alert appears.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: import game link — clipboard detection, paste field, conflict resolution"
```
