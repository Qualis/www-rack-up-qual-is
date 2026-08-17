export type ExerciseValueField = "reps" | "weight";

export interface ExerciseOverride {
  readonly reps: string | null;
  readonly weight: string | null;
}

export interface ExercisePrescription {
  readonly reps: string;
  readonly weight: string;
  readonly isRepsAdjusted: boolean;
  readonly isWeightAdjusted: boolean;
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
