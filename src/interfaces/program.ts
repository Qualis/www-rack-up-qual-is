export interface ExerciseSummary {
  readonly key: string;
  readonly name: string;
  readonly cue: string;
  readonly sets: string;
  readonly reps: string;
  readonly demoUrl: string;
  readonly illustrationSvg: string;
}

export type WarmUpExercise = ExerciseSummary;

export interface Exercise extends ExerciseSummary {
  readonly restSeconds: number;
  readonly restLabel: string;
  readonly weight: string;
}

export interface WarmUp {
  readonly guidance: string;
  readonly exercises: readonly WarmUpExercise[];
}

export interface ProgramDay {
  readonly day: number;
  readonly name: string;
  readonly focus: string;
  readonly optional: boolean;
  readonly estimatedMinutes: number;
  readonly warmup: WarmUp;
  readonly exercises: readonly Exercise[];
}

export interface ScheduleEntry {
  readonly day: string;
  readonly session: string;
  readonly type: string;
}

export interface Program {
  readonly title: string;
  readonly split: string;
  readonly units: string;
  readonly notes: Readonly<Record<string, string>>;
  readonly schedule: readonly ScheduleEntry[];
  readonly days: readonly ProgramDay[];
}
