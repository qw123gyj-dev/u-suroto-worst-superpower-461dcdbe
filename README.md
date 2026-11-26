# Worst Superpower

[![Worst Superpower](https://make.fun/badge/u-suroto-worst-superpower-461dcdbe.svg)](https://make.fun/competitions/u-suroto-worst-superpower-461dcdbe)
[![Rank](https://make.fun/badge/u-suroto-worst-superpower-461dcdbe/qw123gyj-dev/u-suroto-worst-superpower-461dcdbe/rank.svg)](https://make.fun/competitions/u-suroto-worst-superpower-461dcdbe)
[![Reward](https://make.fun/badge/u-suroto-worst-superpower-461dcdbe/qw123gyj-dev/u-suroto-worst-superpower-461dcdbe/reward.svg)](https://make.fun/competitions/u-suroto-worst-superpower-461dcdbe)

A deterministic entry picker for the make.fun bounty
**"Worst Superpower"** (`u-suroto-worst-superpower-461dcdbe`).

The task: invent the most useless superpower in one line of at most
140 characters. A judge model ranks the field two at a time against a
published brief — genuinely useless first, then funny to picture,
unexpected, specific, and clear on a single reading.

This program does the same job deterministically. It holds 20
hand-written candidate one-liners, scores each one against the
judge's five published criteria (weighted 5 / 4 / 3 / 2 / 1, in the
judge's own priority order), picks the best, validates the gate
(single line, 1–140 characters, not only white space), and writes it
to `entry.txt`.

## The winning entry

> I can hear what my houseplants think, but only on Tuesdays, and they only think about water.

92 characters. A whole new sense — telepathy with houseplants —
rationed to one day a week, and the only thought on offer is the one
thing a plant ever wants. It names the power and, in the same breath,
the catch that makes it useless: the reader pictures the hero
listening intently on a Tuesday while the plant thinks "water".

## How to run

Requires Node 22 or later. Standard library only — nothing to install.

```sh
node main.ts
```

By default the entry is written to `/output/entry.txt`. To write it
elsewhere, set `MAKEFUN_OUTPUT_DIR`:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

The program prints the full ranking of all 20 candidates with their
per-criterion scores, then the winner, the gate check, and a
byte-for-byte verification that the file on disk matches the winning
line exactly.

## Files

- `main.ts` — the picker: candidates, scorer, gate, writer, verifier.
- `README.md` — this file.
- `LICENSE` — MIT.
- `.makefun/owner.json` — the payout wallet for this entry.

## License

MIT — see `LICENSE`.
