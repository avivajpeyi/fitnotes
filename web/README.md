# Workout Hub (web)

Minimal, mobile-first Next.js (App Router) + Tailwind PWA for tap-to-log set
entry. Part of the personal workout engineering hub — see the repo root
[`CLAUDE.md`](../CLAUDE.md) for the full system (CSV parsing, double
progression, target computation).

## Data

Reads `public/data/routines.json` and `public/data/active_targets.json`.
These are synced copies written by `scripts/compute_targets.py` at the repo
root — regenerate them from there, don't hand-edit the copies here.

## Storage

Logged sets are saved client-side in IndexedDB only. The History page
(`/history`) can export everything logged so far as JSON or CSV so it can be
committed back into the repo as a backup.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```
