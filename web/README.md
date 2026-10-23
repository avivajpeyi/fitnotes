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
npm run build   # static export in out/
python3 -m http.server 3000 --directory out
```

## Public Workout Library

`/library/` browses eight original generic programs, filters equipment/frequency/
goal/experience/duration, previews every day, and copies/downloads the same JSON
that Android imports. `/catalog/manifest.json` references immutable versioned
files and their SHA-256 digests. These contain prescriptions with no personal
weights. Content is CC BY 4.0; see `public/catalog/LICENSE.txt`.

Edit `public/catalog/` for catalog content. Keep published version files unchanged:
add a new version/path and update its manifest entry. Canonical exercise references
live in `exercises.json` and the manifest; keep them consistent. The canonical
import schema is `../data/programs/schema-v1.json`, mirrored before the static
build. Android bundles three exact starter files at build time.

From the repository root (Python dependency: `jsonschema==4.26.0`):

```bash
python3 scripts/validate_catalog.py
python3 scripts/test_catalog_validation.py
cd web
npm ci
npm run lint
NEXT_PUBLIC_BASE_PATH=/fitnotes npm run build
cd ..
python3 scripts/validate_catalog.py --export
```

PR CI also compares published file bytes against the base branch. The existing
Pages deployment validates catalog data before exporting/uploading `web/out`.
Pages controls response cache headers; Android explicitly revalidates the manifest
and verifies selected program hashes. The service worker uses network-first for
the library/catalog and never caches failed HTTP responses.
