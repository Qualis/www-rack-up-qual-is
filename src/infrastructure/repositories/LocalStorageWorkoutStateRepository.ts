import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { DayState, ExerciseOverride, WorkoutState } from "@/interfaces/workout";
import { readJson, subscribeToKey, writeJson } from "@/lib/localStorageAccess";
import { EMPTY_WORKOUT_STATE, WORKOUT_STATE_VERSION } from "@/lib/workoutState";

export const WORKOUT_STATE_STORAGE_KEY = "rackup-workout-state";

const MINIMUM_SUPPORTED_VERSION = 1;

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null;
}

function isCompletedSetIndexes(candidate: unknown): boolean {
  return (
    Array.isArray(candidate) &&
    candidate.every((entry) => typeof entry === "number")
  );
}

function isAdjustedValue(candidate: unknown): boolean {
  return candidate === null || typeof candidate === "string";
}

function isExerciseOverride(candidate: unknown): boolean {
  if (!isRecord(candidate)) {
    return false;
  }

  const { reps, weight } = candidate as unknown as ExerciseOverride;

  return isAdjustedValue(reps) && isAdjustedValue(weight);
}

function isDayState(candidate: unknown): boolean {
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
  isValidEntry: (entry: unknown) => boolean
): Record<string, T> {
  if (!isRecord(candidate)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(candidate).filter(([, entry]) => isValidEntry(entry))
  ) as Record<string, T>;
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
    days: salvageEntries<DayState>(candidate["days"], isDayState),
    exercises: salvageEntries<ExerciseOverride>(
      candidate["exercises"],
      isExerciseOverride
    ),
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
