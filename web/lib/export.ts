import type { LoggedSet } from "./types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportAsJson(sets: LoggedSet[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  download(`fitnotes-backup-${stamp}.json`, JSON.stringify(sets, null, 2), "application/json");
}

const CSV_HEADER = [
  "date",
  "routineName",
  "exerciseName",
  "setNumber",
  "weightKg",
  "reps",
  "targetWeightKg",
  "targetRepsMin",
  "targetRepsMax",
  "completed",
];

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportAsCsv(sets: LoggedSet[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const rows = [CSV_HEADER.join(",")];
  for (const s of sets) {
    rows.push(
      [
        s.date,
        s.routineName,
        s.exerciseName,
        s.setNumber,
        s.weightKg,
        s.reps,
        s.targetWeightKg,
        s.targetRepsMin,
        s.targetRepsMax,
        s.completed,
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  download(`fitnotes-backup-${stamp}.csv`, rows.join("\n") + "\n", "text/csv");
}
