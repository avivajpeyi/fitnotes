import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ActiveTargetsFile, RoutinesFile } from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function readRoutines(): Promise<RoutinesFile> {
  const raw = await readFile(path.join(DATA_DIR, "routines.json"), "utf-8");
  return JSON.parse(raw);
}

export async function readActiveTargets(): Promise<ActiveTargetsFile> {
  const raw = await readFile(path.join(DATA_DIR, "active_targets.json"), "utf-8");
  return JSON.parse(raw);
}
