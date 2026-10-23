import { readFile } from "node:fs/promises";
import path from "node:path";
import WorkoutLibrary from "@/components/WorkoutLibrary";
import type { LibraryManifest, LibraryProgram } from "@/lib/catalog-types";

export const metadata = { title: "FitNotes Workout Library" };

export default async function LibraryPage() {
  const directory = path.join(process.cwd(), "public/catalog");
  const manifest: LibraryManifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  const definitions: Record<string, LibraryProgram> = {};
  const raw: Record<string, string> = {};
  for (const e of manifest.programs) {
    raw[e.id] = await readFile(path.join(directory, e.path), "utf8");
    definitions[e.id] = JSON.parse(raw[e.id]);
  }
  return <WorkoutLibrary manifest={manifest} definitions={definitions} raw={raw} base={process.env.NEXT_PUBLIC_BASE_PATH || ""} />;
}
