import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import {
  DayState,
  ExerciseOverride,
  ValueOverride,
  WorkoutState,
} from "@/interfaces/workout";
import { readJson, subscribeToKey, writeJson } from "@/lib/localStorageAccess";
import { EMPTY_WORKOUT_STATE, WORKOUT_STATE_VERSION } from "@/lib/workoutState";

export const WORKOUT_STATE_STORAGE_KEY = "rackup-workout-state";

const MINIMUM_SUPPORTED_VERSION = 1;

type ValueOverrideRecord = Record<string, unknown> & ValueOverride;

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null;
}

function isAdjustedValue(candidate: unknown): boolean {
  return candidate === null || typeof candidate === "string";
}

function isCompletedSetIndexes(candidate: unknown): boolean {
  return (
    Array.isArray(candidate) &&
    candidate.every((entry) => typeof entry === "number")
  );
}

function isValueOverride(candidate: unknown): candidate is ValueOverrideRecord {
  if (!isRecord(candidate)) {
    return false;
  }

  const { reps, weight } = candidate as unknown as ValueOverride;

  return isAdjustedValue(reps) && isAdjustedValue(weight);
}

function isDayState(candidate: unknown): candidate is DayState {
  if (!isRecord(candidate)) {
    return false;
  }

  const { lastActiveDate, completedSets } = candidate as unknown as DayState;

  return (
    typeof lastActiveDate === "string" &&
    isRecord(completedSets) &&
    Object.values(completedSets).every(isCompletedSetIndexes)
  );
}

function salvageEntries<T>(
  candidate: unknown,
  reviveEntry: (entry: unknown) => T | null
): Record<string, T> {
  if (!isRecord(candidate)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(candidate)
      .map(([key, entry]): [string, T | null] => [key, reviveEntry(entry)])
      .filter((entry): entry is [string, T] => entry[1] !== null)
  );
}

function reviveDayState(candidate: unknown): DayState | null {
  return isDayState(candidate) ? candidate : null;
}

function reviveValueOverride(candidate: unknown): ValueOverride | null {
  return isValueOverride(candidate)
    ? { reps: candidate.reps, weight: candidate.weight }
    : null;
}

function reviveExerciseOverride(candidate: unknown): ExerciseOverride | null {
  return isValueOverride(candidate)
    ? {
        reps: candidate.reps,
        weight: candidate.weight,
        sets: salvageEntries(candidate["sets"], reviveValueOverride),
      }
    : null;
}

export function migrateWorkoutState(candidate: unknown): WorkoutState | null {
  if (!isRecord(candidate)) {
    return null;
  }

  const version = candidate["version"];

  if (typeof version !== "number" || version < MINIMUM_SUPPORTED_VERSION) {
    return null;
  }

  return {
    version: WORKOUT_STATE_VERSION,
    days: salvageEntries(candidate["days"], reviveDayState),
    exercises: salvageEntries(candidate["exercises"], reviveExerciseOverride),
  };
}

export class LocalStorageWorkoutStateRepository
  implements IWorkoutStateRepository
{
  private cachedState: WorkoutState | null = null;
  private listeners: Set<() => void> = new Set();
  private persistenceFailed = false;

  load(): WorkoutState {
    if (this.cachedState === null) {
      this.cachedState =
        readJson(WORKOUT_STATE_STORAGE_KEY, migrateWorkoutState) ??
        EMPTY_WORKOUT_STATE;
    }

    return this.cachedState;
  }

  save(state: WorkoutState): void {
    this.cachedState = state;
    this.persistenceFailed = !writeJson(WORKOUT_STATE_STORAGE_KEY, state);
    this.notifyListeners();
  }

  hasPersistenceFailed(): boolean {
    return this.persistenceFailed;
  }

  subscribe(onChange: () => void): () => void {
    this.cachedState = null;
    this.listeners.add(onChange);

    const stopWatchingStorage = subscribeToKey(
      WORKOUT_STATE_STORAGE_KEY,
      () => {
        this.cachedState = null;
        this.notifyListeners();
      }
    );

    return () => {
      this.listeners.delete(onChange);
      stopWatchingStorage();
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}
