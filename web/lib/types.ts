export type ExerciseStatus = "new" | "progressing" | "hold" | "plateau";

export interface RoutineExerciseConfig {
  name: string;
  category: string;
  repRangeMin: number;
  repRangeMax: number;
  sets: number;
  progressionIncrementKg: number;
  startWeightKg: number;
  lowerBackRisk?: string;
  preferredOver?: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExerciseConfig[];
}

export interface RoutinesFile {
  schemaVersion: number;
  routines: Routine[];
}

export interface TargetSetPerformance {
  weight_kg: number;
  reps: number;
  e1rm: number;
}

export interface LastSession {
  date: string;
  sets: TargetSetPerformance[];
  topSetE1rm: number;
}

export interface E1rmPoint {
  date: string;
  e1rm: number;
}

export interface ExerciseTarget {
  name: string;
  targetWeightKg: number;
  repRangeMin: number;
  repRangeMax: number;
  targetSets: number;
  status: ExerciseStatus;
  plateauWeeks: number;
  lastSession: LastSession | null;
  e1rmTrend: E1rmPoint[];
  note: string;
}

export interface RoutineTargets {
  id: string;
  name: string;
  exercises: ExerciseTarget[];
}

export interface ActiveTargetsFile {
  schemaVersion: number;
  generatedAt: string | null;
  routines: RoutineTargets[];
}

/** One completed set, logged locally in IndexedDB by the web app. */
export interface LoggedSet {
  id: string;
  routineId: string;
  routineName: string;
  exerciseName: string;
  date: string;
  weightKg: number;
  reps: number;
  targetWeightKg: number;
  targetRepsMin: number;
  targetRepsMax: number;
  setNumber: number;
  completed: boolean;
  createdAt: string;
}
