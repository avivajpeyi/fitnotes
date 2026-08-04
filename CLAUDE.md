# Personal Workout Engineering Hub

Single-user gym system. No auth, no multi-tenant complexity — every file in
this repo exists to answer one question with zero thinking required at the
gym: **what weight and reps do I do right now, for this exercise.**

## Philosophy

1. **Eliminate decision fatigue.** Every exercise in `data/active_targets.json`
   has one target weight and one target rep range. The lifter never chooses —
   they load the bar/pin to the number and go.
2. **Double progression, 2-rep style.** Each exercise has a target rep range
   (e.g. 8-12) done across a fixed number of sets. Progress reps within the
   range across sessions; once **every set hits the top of the range**,
   increase load next session and drop back to the bottom of the range.
3. **Protect the lower back.** Prefer cable, machine, and chest-supported
   variants over heavy standing/free-weight hinge and row movements. In
   `data/routines.json` this is encoded per-exercise as `"lowerBackRisk"` and
   `"preferredOver"` (the riskier exercise this one is substituted for — e.g.
   Chest Supported Row's `preferredOver` is "Barbell Row"). Never suggest
   swapping back to the riskier variant unless the user explicitly asks.
4. **Track strength with e1RM, not just weight.** Because rep ranges vary by
   exercise and session, use Estimated 1RM to compare progress on a common
   scale:

   ```
   e1RM = weight_kg * (1 + reps / 30)
   ```

## Repo map

```
CLAUDE.md                    # this file
data/
  fitnotes_export.csv        # raw FitNotes Android export (replace with your own)
  parsed_history.json        # intermediate cache written by parse_fitnotes.py (gitignored)
  routines.json              # routine templates: exercises, rep ranges, sets, increments
  active_targets.json        # SOURCE OF TRUTH: computed targets, read by the web app
scripts/
  parse_fitnotes.py          # CSV -> normalized sets -> per-exercise volume/e1RM summary
  compute_targets.py         # double progression + plateau detection -> active_targets.json
web/                         # Next.js (App Router) + Tailwind PWA for tap-to-log set entry
```

## Data pipeline

```
data/fitnotes_export.csv
        │  scripts/parse_fitnotes.py
        ▼
data/parsed_history.json     (per-exercise sessions, sets, e1RM, volume)
        │  scripts/compute_targets.py  (+ data/routines.json)
        ▼
data/active_targets.json     ── synced copy ──▶ web/public/data/active_targets.json
data/routines.json           ── synced copy ──▶ web/public/data/routines.json
```

Run the full pipeline after adding new logged sessions to the CSV (or after
exporting a fresh CSV from the FitNotes app):

```bash
python3 scripts/compute_targets.py
```

This re-parses the CSV, recomputes every exercise's target, overwrites
`data/active_targets.json`, and syncs copies into `web/public/data/` so the
web app picks up the new targets on next load. `data/active_targets.json` is
the only file that should be hand-read for "what do I lift today" — never
read the raw CSV or `parsed_history.json` for that.

### Parsing FitNotes CSV exports

FitNotes (Settings → Export Data → CSV) exports one row per logged set:

```
Date,Exercise,Category,Weight,Reps,Distance,Time,Comment
```

`scripts/parse_fitnotes.py` normalizes this:
- Column names lowercased/underscored; `Date` parsed as ISO (`YYYY-MM-DD`),
  falling back to `DD/MM/YYYY` for locale-exported files.
- `Weight`/`Reps` coerced to float/int; rows missing either (e.g. cardio-only
  rows with only Distance/Time) are skipped.
- Weight assumed **kg** by default; pass `--unit lb` if your FitNotes app is
  set to pounds (converted at `1 lb = 0.45359237 kg`).
- Sets are grouped into sessions (same exercise + same calendar date), and
  each session gets `top_set_e1rm`, `volume_kg`, `max_weight_kg`, `max_reps`.

## Double progression rules (exact logic in `scripts/compute_targets.py`)

For each exercise, look at its most recent logged session:

- **All sets hit `repRangeMax`** → next target weight = last weight +
  `progressionIncrementKg` (per-exercise, default 2.5kg — see
  `data/routines.json`), target reps reset to `repRangeMin`. Status:
  `"progressing"`.
- **Otherwise** → target weight stays the same, note tells the lifter to add
  a rep on their hardest set next time. Status: `"hold"`.
- **Plateau flag**: if the working weight has been unchanged for **3 or more
  consecutive logged sessions** (≈3 weeks on a weekly-per-exercise cadence)
  with no increase in max reps achieved, status becomes `"plateau"` and the
  note suggests a deload (-10%) or swapping the exercise variation. Plateau
  only fires when the lifter is *not* currently hitting top-of-range (that
  case is always `"progressing"` instead).
- **No history** → status `"new"`, target weight = `startWeightKg` from
  `data/routines.json`.

## Terminal summary format

When asked something like **"What are my targets for today's Pull session?"**:

1. Read `data/active_targets.json` directly (re-run
   `python3 scripts/compute_targets.py` first only if the CSV has changed
   since `generatedAt`, or if the user says they just logged a new session).
2. Find the matching routine by name/id (case-insensitive, fuzzy on words
   like "pull"/"push"/"legs").
3. Print a plain-text table in **exactly** this shape (also produced by
   `python3 scripts/compute_targets.py --print <routine-id>`):

```
PULL DAY — Targets for 2026-08-04
==============================================================================
Exercise                            Target     Reps  Sets  Status
------------------------------------------------------------------------------
Lat Pulldown                        42.5kg     8-12     3  → Stay at 42.5kg — aim to add a rep on your hardest set (last: 9).
Chest Supported Row                 32.5kg     8-12     3  ↑ Hit top of rep range (12) on every set last session — load increased by 2.5kg.
Seated Cable Row                      45kg    10-15     3  • No logged history yet. Using starting weight from routines.json.
==============================================================================
```

Status symbols: `↑` progressing (weight increased), `→` hold (same weight,
add reps), `⚠` plateau, `•` new/no history. Keep the table plain-text and
monospace-friendly — no markdown tables, this is meant to be read at a
glance before walking into the gym.

## Web app (`web/`)

Next.js App Router + Tailwind, mobile-first PWA for tap-to-log set entry.
Reads `web/public/data/{routines,active_targets}.json` (synced copies — never
edit these directly, they're overwritten by `compute_targets.py`). Logged
sets are stored client-side in IndexedDB (nothing leaves the device
automatically); the History page has Export JSON/CSV buttons to pull logged
workouts back into this repo as a backup.

```bash
cd web
npm install
npm run dev     # http://localhost:3000
npm run build && npm start   # production
```

After exporting a backup CSV/JSON from the app, it's fine to commit it under
`data/` (e.g. `data/logged/2026-08-04.json`) if you want logged sets tracked
in git — the pipeline itself only reads from the FitNotes CSV export, so
committing app backups is optional record-keeping, not required for targets
to compute correctly.

### Deploying to GitHub Pages

`web/` builds as a static export (`output: "export"` in `next.config.ts`) so
it can be hosted directly from GitHub Pages — no server, no runtime API
routes. `.github/workflows/deploy-pages.yml` builds and deploys it
automatically on every push to `main` that touches `web/**` or the data
files, publishing to `https://<owner>.github.io/fitnotes/`.

One-time setup: in the repo's **Settings → Pages**, set "Source" to **GitHub
Actions** (the workflow won't publish anything until this is set).

Because the routines/targets are read from the filesystem at build time
(`lib/data-server.ts`), the deployed site is a snapshot — it only reflects
whatever was in `data/active_targets.json` at the last build. After running
`python3 scripts/compute_targets.py` with fresh sessions, push to `main` (or
run the workflow manually) to redeploy with the updated targets.

The build sets `NEXT_PUBLIC_BASE_PATH=/fitnotes` (the repo name) so all
routes, the manifest, and the service worker resolve correctly under the
GitHub Pages subpath. Building locally with `npm run build` (no env var) uses
no base path, matching `npm run dev`/`npm start`.
