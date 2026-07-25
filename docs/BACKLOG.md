# Backlog

Small, non-blocking items. Newest first.

## Edit Round sheet: graphical glitch when the keyboard opens

**Reported:** 2026-07-25 (on-device, Android 15, during v1.1.0 verification)
**Severity:** cosmetic — non-blocking, shipped in 1.1.0 as-is

Opening the keyboard while the Edit Round modal is up produces a brief visual
glitch on the sheet. Functionally fine: the comment field is reachable, the sheet
scrolls, and Save/Cancel work.

**Where to look:** `src/components/EditRoundModal.tsx`. The sheet is a
`maxHeight: '90%'` view inside a `Modal`, with a `KeyboardAwareScrollView`
(`bottomOffset={24}`) around the body. Likely candidates, in order:

1. `KeyboardAwareScrollView` resizing inside a `Modal` — the modal is its own
   window, so the sheet animates at the same time as the keyboard and the two
   may not be in step. `useKeyboardHandler` / `useAnimatedKeyboard` would give
   frame-accurate control if the built-in component can't be tuned.
2. Interaction between the `Modal`'s `animationType="slide"` and the keyboard
   animation — worth testing with `animationType="none"` to isolate.
3. `maxHeight: '90%'` recomputing against a changing container height as the
   keyboard opens.

**Context:** this sheet was restructured in 1.1.0 (absolute positioning removed,
body moved into a scroll view) and then migrated to
`react-native-keyboard-controller` when core `KeyboardAvoidingView` proved unable
to work under Android edge-to-edge. See
`docs/superpowers/plans/2026-07-25-release-1.1.0.md` §A3 and the commit
`fix: use keyboard-controller for Android edge-to-edge keyboard handling`.

**Note:** a screenshot of the glitch was not captured at report time — grab one
before digging in.
