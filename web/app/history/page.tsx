"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LoggedSet } from "@/lib/types";
import { getAllSets } from "@/lib/db";
import { exportAsCsv, exportAsJson } from "@/lib/export";

function groupByDate(sets: LoggedSet[]): [string, LoggedSet[]][] {
  const map = new Map<string, LoggedSet[]>();
  for (const s of sets) {
    const arr = map.get(s.date) ?? [];
    arr.push(s);
    map.set(s.date, arr);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export default function HistoryPage() {
  const [sets, setSets] = useState<LoggedSet[] | null>(null);

  useEffect(() => {
    getAllSets().then(setSets);
  }, []);

  const grouped = sets ? groupByDate(sets) : [];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 active:text-zinc-300">
            ← Routines
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-50">History</h1>
        </div>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!sets || sets.length === 0}
          onClick={() => sets && exportAsJson(sets)}
          className="flex-1 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-40"
        >
          Export JSON
        </button>
        <button
          type="button"
          disabled={!sets || sets.length === 0}
          onClick={() => sets && exportAsCsv(sets)}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-100 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {sets === null && <p className="text-sm text-zinc-500">Loading…</p>}
      {sets !== null && sets.length === 0 && (
        <p className="text-sm text-zinc-500">No logged sets yet. Go log a session.</p>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map(([date, daySets]) => (
          <section key={date} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-sm font-semibold text-zinc-300">{date}</h2>
            <ul className="mt-2 divide-y divide-zinc-800">
              {daySets.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-200">{s.exerciseName}</span>
                  <span className="tabular-nums text-zinc-400">
                    {s.weightKg}kg × {s.reps}
                    {s.completed ? " ✓" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
