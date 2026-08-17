import {
  DayState,
  ExerciseOverride,
  ExercisePrescription,
  WorkoutState,
} from "@/interfaces/workout";

export const WORKOUT_STATE_VERSION = 2;

export const NEVER_TRAINED = "";

export const NO_OVERRIDE: ExerciseOverride = { reps: null, weight: null };

export const EMPTY_DAY_STATE: DayState = {
  lastActiveDate: NEVER_TRAINED,
  completedSets: {},
};

export const EMPTY_WORKOUT_STATE: WorkoutState = {
  version: WORKOUT_STATE_VERSION,
  days: {},
  exercises: {},
};

export function dayStateOf(state: WorkoutState, dayNumber: number): DayState {
  return state.days[String(dayNumber)] ?? EMPTY_DAY_STATE;
}

export function completedSetsOf(
  state: WorkoutState,
  dayNumber: number,
  exerciseKey: string
): readonly number[] {
  return dayStateOf(state, dayNumber).completedSets[exerciseKey] ?? [];
}

export function isSetCompleted(
  state: WorkoutState,
  dayNumber: number,
  exerciseKey: string,
  setIndex: number
): boolean {
  return completedSetsOf(state, dayNumber, exerciseKey).includes(setIndex);
}

export function overrideOf(
  state: WorkoutState,
  exerciseKey: string
): ExerciseOverride {
  return state.exercises[exerciseKey] ?? NO_OVERRIDE;
}

export function prescriptionOf(
  programmeDefault: { readonly reps: string; readonly weight: string },
  override: ExerciseOverride
): ExercisePrescription {
  return {
    reps: override.reps ?? programmeDefault.reps,
    weight: override.weight ?? programmeDefault.weight,
    isRepsAdjusted: override.reps !== null,
    isWeightAdjusted: override.weight !== null,
  };
}

export function isEmptyOverride(override: ExerciseOverride): boolean {
  return override.reps === null && override.weight === null;
}

export function withDayState(
  state: WorkoutState,
  dayNumber: number,
  dayState: DayState
): WorkoutState {
  return {
    ...state,
    version: WORKOUT_STATE_VERSION,
    days: { ...state.days, [String(dayNumber)]: dayState },
  };
}

export function withExerciseOverride(
  state: WorkoutState,
  exerciseKey: string,
  override: ExerciseOverride
): WorkoutState {
  return {
    ...state,
    version: WORKOUT_STATE_VERSION,
    exercises: isEmptyOverride(override)
      ? Object.fromEntries(
          Object.entries(state.exercises).filter(([key]) => key !== exerciseKey)
        )
      : { ...state.exercises, [exerciseKey]: override },
  };
}
