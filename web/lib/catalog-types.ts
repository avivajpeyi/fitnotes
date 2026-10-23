export interface LibraryEntry {
  id: string; programVersion: string; path: string; title: string;
  description: string; goal: string; level: string; equipment: string[];
  daysPerWeek: number; minutesPerDay: number; starter: boolean;
}
export interface LibraryManifest {
  catalogVersion: string; programs: LibraryEntry[];
}
export interface LibraryProgram {
  id: string; weeks: number; schedule: string; progression: string; notes: string;
  license: { id: string; url: string; attribution: string };
  days: { id: string; name: string; notes: string; exercises: {
    name: string; notes: string; substitutions?: string[];
    sets: { repsMin: number; repsMax: number; restSeconds: number; rir: number }[];
  }[] }[];
}
