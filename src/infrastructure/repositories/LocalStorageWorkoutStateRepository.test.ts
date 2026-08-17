import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WORKOUT_STATE_VERSION } from "@/lib/workoutState";
import {
  LocalStorageWorkoutStateRepository,
  migrateWorkoutState,
  WORKOUT_STATE_STORAGE_KEY,
} from "./LocalStorageWorkoutStateRepository";

const previousVersionState = {
  version: 1,
  days: {
    "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0, 2] } },
  },
};

const storedState = {
  version: WORKOUT_STATE_VERSION,
  days: {
    "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0, 2] } },
  },
  exercises: {},
};

describe("LocalStorageWorkoutStateRepository", () => {
  let storage: { [key: string]: string };
  let repository: LocalStorageWorkoutStateRepository;

  beforeEach(() => {
    storage = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
      },
      writable: true,
    });

    repository = new LocalStorageWorkoutStateRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return empty state when nothing has been stored yet", () => {
    expect(repository.load().days).toEqual({});
  });

  it("should return the stored progress when it is present", () => {
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify(storedState);

    expect(repository.load().days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });

  it("should discard stored progress written by an unrecognised schema version", () => {
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify({
      ...storedState,
      version: 0,
    });

    expect(repository.load().days).toEqual({});
  });

  it("should keep completed sets recorded before exercise adjustments existed", () => {
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify(previousVersionState);

    expect(repository.load().days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });

  it("should start with no exercise adjustments when upgrading older stored progress", () => {
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify(previousVersionState);

    expect(repository.load().exercises).toEqual({});
  });

  it("should discard corrupted stored progress", () => {
    storage[WORKOUT_STATE_STORAGE_KEY] = "{not json";

    expect(repository.load().days).toEqual({});
  });

  it("should write progress under the RackUp storage key", () => {
    repository.save(storedState);

    expect(JSON.parse(storage[WORKOUT_STATE_STORAGE_KEY] ?? "null")).toEqual(
      storedState
    );
  });

  it("should notify subscribers when another tab changes the stored progress", () => {
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    window.dispatchEvent(
      new StorageEvent("storage", { key: WORKOUT_STATE_STORAGE_KEY })
    );
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should notify subscribers when progress is saved in this tab", () => {
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    repository.save(storedState);
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should return the same state object on repeated reads so snapshots compare by reference", () => {
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify(storedState);

    expect(repository.load()).toBe(repository.load());
  });

  it("should return the saved state without re-reading storage", () => {
    repository.save(storedState);

    expect(repository.load()).toBe(storedState);
  });

  it("should re-read storage after another tab changes the stored progress", () => {
    repository.subscribe(vi.fn());
    const before = repository.load();
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify(storedState);

    window.dispatchEvent(
      new StorageEvent("storage", { key: WORKOUT_STATE_STORAGE_KEY })
    );

    expect(repository.load()).not.toBe(before);
  });

  it("should report healthy persistence after a successful write", () => {
    repository.save(storedState);

    expect(repository.hasPersistenceFailed()).toBe(false);
  });

  it("should report a failed write so the app can warn the user", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new DOMException("full", "QuotaExceededError");
        }),
      },
      writable: true,
    });
    const blocked = new LocalStorageWorkoutStateRepository();

    blocked.save(storedState);

    expect(blocked.hasPersistenceFailed()).toBe(true);
  });

  it("should report healthy persistence before anything has been written", () => {
    expect(repository.hasPersistenceFailed()).toBe(false);
  });

  it("should re-read storage when a new subscriber arrives after a gap", () => {
    const unsubscribe = repository.subscribe(vi.fn());
    repository.load();
    unsubscribe();
    storage[WORKOUT_STATE_STORAGE_KEY] = JSON.stringify(storedState);

    repository.subscribe(vi.fn());

    expect(repository.load().days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });

  it("should stop notifying once unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    unsubscribe();
    repository.save(storedState);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("migrateWorkoutState", () => {
  it("should keep state already written by the current schema version", () => {
    expect(migrateWorkoutState(storedState)).toEqual(storedState);
  });

  it("should upgrade state written before exercise adjustments existed", () => {
    expect(migrateWorkoutState(previousVersionState)).toEqual({
      version: WORKOUT_STATE_VERSION,
      days: previousVersionState.days,
      exercises: {},
    });
  });

  it("should reject a value that is not an object", () => {
    expect(migrateWorkoutState("nonsense")).toBeNull();
  });

  it("should reject null", () => {
    expect(migrateWorkoutState(null)).toBeNull();
  });

  it("should reject state written by an unrecognised schema version", () => {
    expect(migrateWorkoutState({ ...storedState, version: 99 })).toBeNull();
  });

  it("should treat days that are not an object as no recorded days", () => {
    expect(
      migrateWorkoutState({ version: WORKOUT_STATE_VERSION, days: "none" })
        ?.days
    ).toEqual({});
  });

  it("should treat missing exercise adjustments as none", () => {
    expect(
      migrateWorkoutState({ version: WORKOUT_STATE_VERSION, days: {} })
        ?.exercises
    ).toEqual({});
  });

  it("should keep the sound days when one day is malformed", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: { "1": storedState.days["1"], "2": "nonsense" },
      exercises: {},
    });

    expect(Object.keys(salvaged?.days ?? {})).toEqual(["1"]);
  });

  it("should keep the recorded days when an adjustment is malformed", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: storedState.days,
      exercises: { bench: null },
    });

    expect(salvaged?.days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });

  it("should keep the sound adjustments when one is malformed", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: {},
      exercises: {
        bench: { reps: null, weight: "45 kg" },
        squat: { reps: null, weight: 60 },
      },
    });

    expect(Object.keys(salvaged?.exercises ?? {})).toEqual(["bench"]);
  });

  it("should discard a day whose completed set indexes are not numbers", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: {
        "1": { lastActiveDate: "2026-08-16", completedSets: { bench: ["x"] } },
      },
      exercises: {},
    });

    expect(salvaged?.days).toEqual({});
  });

  it("should discard a day whose last active date is missing", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: { "1": { completedSets: {} } },
      exercises: {},
    });

    expect(salvaged?.days).toEqual({});
  });

  it("should discard a day whose completed sets are not an object", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: { "1": { lastActiveDate: "2026-08-16", completedSets: 3 } },
      exercises: {},
    });

    expect(salvaged?.days).toEqual({});
  });

  it("should keep an adjustment that carries only a weight", () => {
    const salvaged = migrateWorkoutState({
      version: WORKOUT_STATE_VERSION,
      days: {},
      exercises: { bench: { reps: null, weight: "45 kg" } },
    });

    expect(salvaged?.exercises["bench"]?.weight).toBe("45 kg");
  });
});
