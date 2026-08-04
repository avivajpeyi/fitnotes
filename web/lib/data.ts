import type { ActiveTargetsFile, RoutinesFile } from "./types";

export async function fetchRoutines(): Promise<RoutinesFile> {
  const res = await fetch("/data/routines.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load routines.json (${res.status})`);
  return res.json();
}

export async function fetchActiveTargets(): Promise<ActiveTargetsFile> {
  const res = await fetch("/data/active_targets.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load active_targets.json (${res.status})`);
  return res.json();
}
