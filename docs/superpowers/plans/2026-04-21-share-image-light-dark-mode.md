# Share Image Light/Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the share-to-image Skia function render in the user's current app theme (light or dark) instead of always using dark mode.

**Architecture:** Add a `colors` parameter to `generateShareImage` so it receives theme colors at call time. Update `useShare` to pull colors from `useTheme()` and pass them through. Remove the now-unused `colors` compat shim from `theme.ts`.

**Tech Stack:** React Native, `@shopify/react-native-skia`, `src/utils/generateShareImage.ts`, `src/hooks/useShare.tsx`, `src/theme.ts`

---

## Files Modified

- `src/utils/generateShareImage.ts` — add `colors: ThemeColors` parameter, remove module-level `colors` import, update `scoreColor` helper to accept `colors`
- `src/hooks/useShare.tsx` — import `useTheme`, pass `colors` to `generateShareImage`
- `src/theme.ts` — remove the `export const colors = darkColors` compat shim

---

### Task 1: Update `generateShareImage` signature to accept colors

**Files:**
- Modify: `src/utils/generateShareImage.ts`

The function currently imports `colors` from `../theme` at line 12 and uses it throughout. We need to:
1. Remove the import
2. Add `colors: ThemeColors` as the second parameter
3. Update `scoreColor` (lines 81–85) which closes over the module-level `colors` — make it accept colors as a parameter instead

- [ ] **Step 1: Update the import at the top of `generateShareImage.ts`**

Replace:
```ts
import { colors } from '../theme';
import type { GameState, PlayerIndex } from '../types';
```
With:
```ts
import type { ThemeColors } from '../theme';
import type { GameState, PlayerIndex } from '../types';
```

- [ ] **Step 2: Update the `scoreColor` helper to accept colors as a parameter**

Replace (lines 81–85):
```ts
function scoreColor(score: number) {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}
```
With:
```ts
function scoreColor(score: number, colors: ThemeColors) {
  if (score > 0) return colors.positive;
  if (score < 0) return colors.danger;
  return colors.textSecondary;
}
```

- [ ] **Step 3: Update the `generateShareImage` function signature**

Replace (line 111):
```ts
export async function generateShareImage(state: GameState): Promise<string> {
```
With:
```ts
export async function generateShareImage(state: GameState, colors: ThemeColors): Promise<string> {
```

- [ ] **Step 4: Fix the three `scoreColor` call sites inside `generateShareImage` to pass `colors`**

There are three calls to `scoreColor` in the function body:

Line ~306:
```ts
drawText(canvas, fmtDelta(round.teamAScore), cx, ry, scoreColor(round.teamAScore), fTiny); cx += COL_DELTA;
drawText(canvas, fmtDelta(round.teamBScore), cx, ry, scoreColor(round.teamBScore), fTiny); cx += COL_DELTA;
```
Change to:
```ts
drawText(canvas, fmtDelta(round.teamAScore), cx, ry, scoreColor(round.teamAScore, colors), fTiny); cx += COL_DELTA;
drawText(canvas, fmtDelta(round.teamBScore), cx, ry, scoreColor(round.teamBScore, colors), fTiny); cx += COL_DELTA;
```

Line ~338:
```ts
drawText(canvas, scoreStr, cx + 16, sy, scoreColor(score), fBase);
```
Change to:
```ts
drawText(canvas, scoreStr, cx + 16, sy, scoreColor(score, colors), fBase);
```

- [ ] **Step 5: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```
Expected: no errors. If there are errors, they will be in `generateShareImage.ts` — check that all `colors.` references use the parameter, not a missing import.

- [ ] **Step 6: Commit**

```bash
git add src/utils/generateShareImage.ts
git commit -m "refactor: accept colors parameter in generateShareImage"
```

---

### Task 2: Pass current theme colors from `useShare`

**Files:**
- Modify: `src/hooks/useShare.tsx`

`useShare` is a React hook, so it can call `useTheme()` to get the live colors. Pass them to `generateShareImage` at call time.

- [ ] **Step 1: Add `useTheme` import to `useShare.tsx`**

The file currently starts with:
```ts
import React, { useState, useCallback } from 'react';
import { Alert, Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { stateToDeepLink } from './gameReducer';
import { generateShareImage } from '../utils/generateShareImage';
import type { GameState } from '../types';
```

Add the `useTheme` import:
```ts
import React, { useState, useCallback } from 'react';
import { Alert, Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { stateToDeepLink } from './gameReducer';
import { generateShareImage } from '../utils/generateShareImage';
import { useTheme } from '../context/ThemeContext';
import type { GameState } from '../types';
```

- [ ] **Step 2: Call `useTheme()` inside the hook body and pass `colors` to `generateShareImage`**

Inside `useShare`, after `const [sharing, setSharing] = useState(false);`, add:
```ts
const { colors } = useTheme();
```

Then update the `generateShareImage` call (currently line 22):
```ts
const uri = await generateShareImage(state);
```
Change to:
```ts
const uri = await generateShareImage(state, colors);
```

Note: `colors` is captured by the `useCallback` closure. Because `colors` is a stable object reference from context (it only changes when the theme changes), this is safe. If you want to be explicit, add `colors` to the `useCallback` dependency array:
```ts
}, [sharing, colors]);
```

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useShare.tsx
git commit -m "feat: pass current theme colors to generateShareImage"
```

---

### Task 3: Remove the compat shim from `theme.ts`

**Files:**
- Modify: `src/theme.ts`

The line `export const colors = darkColors;` (line 74) was the workaround for non-hook utilities. It is now unused. Remove it to avoid confusion.

- [ ] **Step 1: Remove the compat shim**

In `src/theme.ts`, delete:
```ts
// Compat shim for non-component utilities (e.g. generateShareImage) that cannot use hooks
export const colors = darkColors;
```

- [ ] **Step 2: Verify no remaining imports of `colors` from theme**

```bash
grep -r "from '.*theme'" src/ --include="*.ts" --include="*.tsx"
```
Expected output should NOT contain `{ colors }` — only `ThemeColors`, `darkColors`, `lightColors`, `useTheme`.

- [ ] **Step 3: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/theme.ts
git commit -m "chore: remove colors compat shim from theme.ts"
```
