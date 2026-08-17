import {
  DayState,
  ExercisePrescription,
  ExerciseOverride,
  ExerciseValueField,
  ResolvedValue,
  ValueOverride,
  WorkoutState,
} from "@/interfaces/workout";

export const WORKOUT_STATE_VERSION = 3;

export const NEVER_TRAINED = "";

export const NO_VALUE_OVERRIDE: ValueOverride = { reps: null, weight: null };

export const NO_OVERRIDE: ExerciseOverride = {
  reps: null,
  weight: null,
  sets: {},
};

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

export function resolveValue(
  adjustment: string | null,
  fallback: string
): ResolvedValue {
  return {
    value: adjustment ?? fallback,
    fallback,
    isAdjusted: adjustment !== null,
  };
}

export function prescriptionOf(
  fallback: { readonly reps: string; readonly weight: string },
  override: ValueOverride
): ExercisePrescription {
  return {
    reps: resolveValue(override.reps, fallback.reps),
    weight: resolveValue(override.weight, fallback.weight),
  };
}

export function effectiveValuesOf(prescription: ExercisePrescription): {
  readonly reps: string;
  readonly weight: string;
} {
  return { reps: prescription.reps.value, weight: prescription.weight.value };
}

export function setOverrideOf(
  override: ExerciseOverride,
  setIndex: number
): ValueOverride {
  return override.sets[String(setIndex)] ?? NO_VALUE_OVERRIDE;
}

export function setPrescriptionOf(
  programmeDefault: { readonly reps: string; readonly weight: string },
  override: ExerciseOverride,
  setIndex: number
): ExercisePrescription {
  return prescriptionOf(
    effectiveValuesOf(prescriptionOf(programmeDefault, override)),
    setOverrideOf(override, setIndex)
  );
}

export function adjustmentFrom(value: string, fallback: string): string | null {
  const trimmed = value.trim();

  return trimmed === "" || trimmed === fallback.trim() ? null : trimmed;
}

export function withAdjustedValue<T extends ValueOverride>(
  override: T,
  field: ExerciseValueField,
  value: string | null
): T {
  return { ...override, [field]: value };
}

export function isEmptyValueOverride(override: ValueOverride): boolean {
  return override.reps === null && override.weight === null;
}

export function isEmptyOverride(override: ExerciseOverride): boolean {
  return (
    isEmptyValueOverride(override) && Object.keys(override.sets).length === 0
  );
}

export function withSetOverride(
  override: ExerciseOverride,
  setIndex: number,
  next: ValueOverride
): ExerciseOverride {
  const key = String(setIndex);

  return {
    ...override,
    sets: isEmptyValueOverride(next)
      ? Object.fromEntries(
          Object.entries(override.sets).filter(([stored]) => stored !== key)
        )
      : { ...override.sets, [key]: next },
  };
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
