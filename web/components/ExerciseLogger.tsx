"use client";

import { useEffect, useState } from "react";
import type { ExerciseTarget, LoggedSet } from "@/lib/types";
import { getSetsForRoutineToday, makeSetId, saveSet } from "@/lib/db";
import StatusBadge from "./StatusBadge";

interface Row {
  id: string;
  weightKg: number;
  reps: number;
  completed: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ExerciseLogger({
  routineId,
  routineName,
  target,
}: {
  routineId: string;
  routineName: string;
  target: ExerciseTarget;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: target.targetSets }, () => ({
      id: makeSetId(),
      weightKg: target.targetWeightKg,
      reps: target.repRangeMax,
      completed: false,
    }))
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSetsForRoutineToday(routineId, todayIso()).then((existing) => {
      if (cancelled) return;
      const mine = existing
        .filter((s) => s.exerciseName === target.name)
        .sort((a, b) => a.setNumber - b.setNumber);
      if (mine.length > 0) {
        setRows(
          mine.map((s) => ({ id: s.id, weightKg: s.weightKg, reps: s.reps, completed: s.completed }))
        );
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [routineId, target.name]);

  const persist = (row: Row, setNumber: number) => {
    const entry: LoggedSet = {
      id: row.id,
      routineId,
      routineName,
      exerciseName: target.name,
      date: todayIso(),
      weightKg: row.weightKg,
      reps: row.reps,
      targetWeightKg: target.targetWeightKg,
      targetRepsMin: target.repRangeMin,
      targetRepsMax: target.repRangeMax,
      setNumber,
      completed: row.completed,
      createdAt: new Date().toISOString(),
    };
    void saveSet(entry);
  };

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, ...patch } : r));
      persist(next[index], index + 1);
      return next;
    });
  };

  if (!loaded) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-50">{target.name}</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Target {target.targetWeightKg}kg · {target.repRangeMin}-{target.repRangeMax} reps ·{" "}
            {target.targetSets} sets
          </p>
        </div>
        <StatusBadge status={target.status} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{target.note}</p>

      <div className="mt-4 flex items-center gap-2 px-2 text-[10px] uppercase tracking-wide text-zinc-600">
        <span className="w-4 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-1.5">
          <span className="flex-1 text-center">kg</span>
          <span className="flex-1 text-center">reps</span>
        </div>
        <span className="w-11 shrink-0" />
      </div>
      <div className="mt-1 space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.id}
            className={`flex items-center gap-2 rounded-xl border p-2 transition ${
              row.completed ? "border-emerald-600/40 bg-emerald-500/10" : "border-zinc-800 bg-zinc-950"
            }`}
          >
            <span className="w-4 shrink-0 text-center text-sm text-zinc-500">{i + 1}</span>

            <div className="flex min-w-0 flex-1 gap-1.5">
              <Stepper
                value={row.weightKg}
                step={2.5}
                unit="kg"
                onChange={(v) => updateRow(i, { weightKg: v })}
              />
              <Stepper value={row.reps} step={1} unit="reps" onChange={(v) => updateRow(i, { reps: v })} />
            </div>

            <button
              type="button"
              aria-pressed={row.completed}
              onClick={() => updateRow(i, { completed: !row.completed })}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold transition active:scale-95 ${
                row.completed
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {row.completed ? "✓" : ""}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  value,
  step,
  unit,
  onChange,
}: {
  value: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center justify-between gap-0.5 rounded-xl bg-zinc-800 px-0.5 py-0.5"
      title={unit}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, Math.round((value - step) * 100) / 100))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base text-zinc-300 active:bg-zinc-700"
      >
        −
      </button>
      <div className="min-w-0 flex-1 truncate text-center text-sm tabular-nums text-zinc-50">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.round((value + step) * 100) / 100)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base text-zinc-300 active:bg-zinc-700"
      >
        +
      </button>
    </div>
  );
}
