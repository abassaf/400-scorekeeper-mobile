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

Edit it from whichever consumer repo you happen to be in — the subtree is a real working
copy, not a read-only mount.

```sh
# from either consumer repo, after editing src/shared/**
pnpm scoring:push     # git subtree push --prefix src/shared shared main

# in the other consumer repo
pnpm scoring:pull     # git subtree pull --prefix src/shared shared main --squash
```

Run the tests from the mobile repo (`pnpm test`) before pushing — that is the only place
they execute.

First-time mount in a new consumer:

```sh
git remote add shared git@github.com:abassaf/400-scorekeeper-scoring.git
git subtree add --prefix src/shared shared main --squash
```

### Known ceiling

Pulling is manual, so the two mounts can sit at different commits for a while. That is
acceptable for one developer across two repos. If it starts causing drift, add a CI check
that fails when `src/shared` doesn't match this repo's `main`.
