# 400-scorekeeper-scoring

Single source of truth for the 400 card game scoring rules, shared by:

- [`400-scorekeeper-mobile`](https://github.com/abassaf/400-scorekeeper-mobile) (Expo / React Native)
- [`400-scorekeeper`](https://github.com/abassaf/400-scorekeeper) (React + Vite)

Both consume it via `git subtree` mounted at `src/shared/`, and re-export it through
one-line barrels at `src/scoring.ts` / `src/types.ts` so no import paths change.

Plain TypeScript source — no `package.json`, no build step, no dependencies. Each consumer
compiles it with its own toolchain (Metro / Vite).

## Files

| File | Notes |
|---|---|
| `scoring.ts` | `SCORE_TABLE`, `playerScore`, `calcRound`, `runningTotals`, `playerCumulativeScore`, `playerStats` |
| `types.ts` | `PlayerEntry`, `Round`, `GameState`, `PlayerIndex` |
| `scoring.test.ts` | Jest. Runs from the **mobile** repo (`pnpm test`) — this repo has no runner of its own. |

## Scoring rules

Making your bid scores `SCORE_TABLE[called]`. Missing it costs the raw bid by default, or
the full table value when `harshDoubles` is on — so a missed call of 5 loses 10 rather than 5.
Bids of 1-4 score their face value and are identical under both rules.

`harshDoubles` is a per-game setting chosen at setup and locked for the life of the game:
`Round.teamAScore`/`teamBScore` are persisted snapshots, so changing the rule mid-game would
desync stored team totals from recomputed per-player totals. It is optional on `GameState`
so previously saved games and shared deep links deserialise unchanged and read as `false`.

## Working on this code

**Edit here, in this repo. The `src/shared/` mounts in the consumers are pull-only.**

Local clone lives at `~/Developer/400-scorekeeper-scoring`.

```sh
# 1. change the rule here
cd ~/Developer/400-scorekeeper-scoring
$EDITOR scoring.ts
git commit -am "..." && git push

# 2. pull it into both consumers
cd ~/Developer/400-scorekeeper-mobile && pnpm scoring:pull && pnpm test
cd ~/Developer/400-scorekeeper       && pnpm scoring:pull && pnpm build
```

The mobile repo is the only place the tests execute — run `pnpm test` there after every pull.

### Do not edit `src/shared/**` inside a consumer repo

`git subtree push` rewrites commits during the split, so a pushed change comes back on the
next pull as a *second, unrelated* commit touching the same lines. A later revert then merges
incorrectly and the two mounts silently disagree. This was hit and diagnosed on 2026-07-25;
pull-only sidesteps the entire failure mode.

There is deliberately no `scoring:push` script. If you edit `src/shared/**` in a consumer by
accident, copy the change here by hand and `git checkout -- src/shared` over there.

Do not add `--squash` to the mount or the pull either — it corrupts the prefix mapping in the
same way, and worse: a squashed pull can drag the consumer's entire root tree into
`src/shared/`.

### First-time mount in a new consumer

```sh
git remote add shared git@github.com:abassaf/400-scorekeeper-scoring.git
git subtree add --prefix src/shared shared main
```

Then re-export through one-line barrels so no import paths change:

```ts
export * from './shared/scoring';   // src/scoring.ts
export * from './shared/types';     // src/types.ts
```

### Known ceiling

Pulling is manual, so the two mounts can sit at different commits for a while. That is
acceptable for one developer across two repos. If it starts causing drift, add a CI check
that fails when `src/shared` doesn't match this repo's `main`.
