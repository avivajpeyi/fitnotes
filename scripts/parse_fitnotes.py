#!/usr/bin/env python3
"""Parse a FitNotes CSV export into normalized session/set data.

Usage:
    python3 scripts/parse_fitnotes.py [--csv data/fitnotes_export.csv] [--unit kg|lb] [--out data/parsed_history.json]

FitNotes (Android app) exports a CSV with these columns:
    Date,Exercise,Category,Weight,Reps,Distance,Time,Comment

Each row is one logged set. This script:
  1. Normalizes column names and types (date -> ISO date, weight -> float kg, reps -> int).
  2. Computes Estimated 1RM per set: e1RM = weight * (1 + reps / 30).
  3. Groups sets into sessions (same exercise + same date) and computes per-session
     and per-exercise volume / progression summaries.
  4. Writes the normalized result to data/parsed_history.json for
     scripts/compute_targets.py to consume, and prints a human-readable summary.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = REPO_ROOT / "data" / "fitnotes_export.csv"
DEFAULT_OUT = REPO_ROOT / "data" / "parsed_history.json"

LB_TO_KG = 0.45359237


def e1rm(weight_kg: float, reps: int) -> float:
    """Epley-style estimated 1RM used throughout this project: weight * (1 + reps/30)."""
    return round(weight_kg * (1 + reps / 30), 2)


@dataclass
class SetEntry:
    date: str
    exercise: str
    category: str
    weight_kg: float
    reps: int
    e1rm: float
    comment: str


def normalize_header(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def parse_csv(csv_path: Path, unit: str = "kg") -> list[SetEntry]:
    if not csv_path.exists():
        raise FileNotFoundError(
            f"No FitNotes export found at {csv_path}. "
            "Export your history from FitNotes (Settings > Export Data > CSV) "
            "and place it there."
        )

    sets: list[SetEntry] = []
    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [normalize_header(h) for h in (reader.fieldnames or [])]
        for row in reader:
            weight_raw = (row.get("weight") or "").strip()
            reps_raw = (row.get("reps") or "").strip()
            exercise = (row.get("exercise") or "").strip()
            date_raw = (row.get("date") or "").strip()

            # Skip rows that aren't weighted-reps sets (e.g. cardio-only rows
            # with distance/time but no weight or reps).
            if not exercise or not weight_raw or not reps_raw:
                continue

            try:
                weight = float(weight_raw)
                reps = int(float(reps_raw))
            except ValueError:
                continue

            if unit == "lb":
                weight = weight * LB_TO_KG

            try:
                date_iso = datetime.strptime(date_raw, "%Y-%m-%d").date().isoformat()
            except ValueError:
                # FitNotes can also export as DD/MM/YYYY depending on locale settings.
                date_iso = datetime.strptime(date_raw, "%d/%m/%Y").date().isoformat()

            sets.append(
                SetEntry(
                    date=date_iso,
                    exercise=exercise,
                    category=(row.get("category") or "").strip(),
                    weight_kg=round(weight, 2),
                    reps=reps,
                    e1rm=e1rm(weight, reps),
                    comment=(row.get("comment") or "").strip(),
                )
            )

    sets.sort(key=lambda s: (s.exercise, s.date))
    return sets


def group_sessions(sets: list[SetEntry]) -> dict[str, list[dict]]:
    """Group sets by exercise -> list of sessions (one per date), each with its sets."""
    by_exercise: dict[str, dict[str, list[SetEntry]]] = defaultdict(lambda: defaultdict(list))
    for s in sets:
        by_exercise[s.exercise][s.date].append(s)

    result: dict[str, list[dict]] = {}
    for exercise, by_date in by_exercise.items():
        sessions = []
        for date in sorted(by_date.keys()):
            day_sets = by_date[date]
            sessions.append(
                {
                    "date": date,
                    "sets": [
                        {"weight_kg": s.weight_kg, "reps": s.reps, "e1rm": s.e1rm}
                        for s in day_sets
                    ],
                    "top_set_e1rm": max(s.e1rm for s in day_sets),
                    "volume_kg": round(sum(s.weight_kg * s.reps for s in day_sets), 1),
                    "max_weight_kg": max(s.weight_kg for s in day_sets),
                    "max_reps": max(s.reps for s in day_sets),
                }
            )
        result[exercise] = sessions
    return result


def build_summary(sessions_by_exercise: dict[str, list[dict]]) -> dict[str, dict]:
    summary = {}
    for exercise, sessions in sessions_by_exercise.items():
        if not sessions:
            continue
        best = max(sessions, key=lambda sess: sess["top_set_e1rm"])
        first, last = sessions[0], sessions[-1]
        trend = round(last["top_set_e1rm"] - first["top_set_e1rm"], 2)
        summary[exercise] = {
            "sessions_logged": len(sessions),
            "first_session_date": first["date"],
            "last_session_date": last["date"],
            "best_e1rm": best["top_set_e1rm"],
            "best_e1rm_date": best["date"],
            "current_e1rm": last["top_set_e1rm"],
            "e1rm_trend_since_first_session": trend,
            "total_volume_kg": round(sum(s["volume_kg"] for s in sessions), 1),
        }
    return summary


def print_report(summary: dict[str, dict]) -> None:
    if not summary:
        print("No sets parsed. Check data/fitnotes_export.csv formatting.")
        return

    print(f"{'Exercise':<32} {'Sessions':>8} {'Last e1RM':>10} {'Best e1RM':>10} {'Trend':>8} {'Volume(kg)':>11}")
    print("-" * 84)
    for exercise, s in sorted(summary.items()):
        trend_str = f"{s['e1rm_trend_since_first_session']:+.1f}"
        print(
            f"{exercise:<32} {s['sessions_logged']:>8} {s['current_e1rm']:>10.1f} "
            f"{s['best_e1rm']:>10.1f} {trend_str:>8} {s['total_volume_kg']:>11.1f}"
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Path to FitNotes CSV export")
    parser.add_argument("--unit", choices=["kg", "lb"], default="kg", help="Unit weights are logged in")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Where to write parsed_history.json")
    parser.add_argument("--quiet", action="store_true", help="Suppress the printed report")
    args = parser.parse_args(argv)

    try:
        sets = parse_csv(args.csv, unit=args.unit)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    sessions_by_exercise = group_sessions(sets)
    summary = build_summary(sessions_by_exercise)

    output = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "sourceCsv": str(args.csv.relative_to(REPO_ROOT)) if args.csv.is_relative_to(REPO_ROOT) else str(args.csv),
        "totalSetsParsed": len(sets),
        "sessionsByExercise": sessions_by_exercise,
        "summaryByExercise": summary,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(output, indent=2) + "\n")

    if not args.quiet:
        print(f"Parsed {len(sets)} sets across {len(sessions_by_exercise)} exercises from {args.csv}")
        print(f"Wrote {args.out.relative_to(REPO_ROOT) if args.out.is_relative_to(REPO_ROOT) else args.out}\n")
        print_report(summary)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
