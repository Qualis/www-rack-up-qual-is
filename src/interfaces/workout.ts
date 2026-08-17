export type ExerciseValueField = "reps" | "weight";

export interface ValueOverride {
  readonly reps: string | null;
  readonly weight: string | null;
}

export interface ExerciseOverride extends ValueOverride {
  readonly sets: Readonly<Record<string, ValueOverride>>;
}

export interface ResolvedValue {
  readonly value: string;
  readonly fallback: string;
  readonly isAdjusted: boolean;
}

export interface ExercisePrescription {
  readonly reps: ResolvedValue;
  readonly weight: ResolvedValue;
}

export interface DayState {
  readonly lastActiveDate: string;
  readonly completedSets: Readonly<Record<string, readonly number[]>>;
}

export interface WorkoutState {
  readonly version: number;
  readonly days: Readonly<Record<string, DayState>>;
  readonly exercises: Readonly<Record<string, ExerciseOverride>>;
}

export interface ExerciseProgress {
  readonly exerciseKey: string;
  readonly name: string;
  readonly completedSets: number;
  readonly totalSets: number;
}

export interface DayProgress {
  readonly dayNumber: number;
  readonly completedSets: number;
  readonly totalSets: number;
  readonly exercises: readonly ExerciseProgress[];
}

export interface RestTimer {
  readonly dayNumber: number;
  readonly exerciseKey: string;
  readonly exerciseName: string;
  readonly durationSeconds: number;
  readonly endsAt: number;
}
