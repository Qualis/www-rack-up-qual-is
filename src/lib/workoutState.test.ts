import { describe, expect, it } from "vitest";
import { WorkoutState } from "@/interfaces/workout";
import {
  completedSetsOf,
  dayStateOf,
  isEmptyOverride,
  NO_OVERRIDE,
  overrideOf,
  prescriptionOf,
  withExerciseOverride,
  EMPTY_DAY_STATE,
  EMPTY_WORKOUT_STATE,
  isSetCompleted,
  withDayState,
  WORKOUT_STATE_VERSION,
} from "./workoutState";

const stateWithBenchSets: WorkoutState = {
  version: WORKOUT_STATE_VERSION,
  days: {
    "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0, 2] } },
  },
  exercises: { bench: { reps: "6", weight: "45 kg" } },
};

describe("dayStateOf", () => {
  it("should return the stored day state when the day has been trained", () => {
    expect(dayStateOf(stateWithBenchSets, 1).lastActiveDate).toBe("2026-08-16");
  });

  it("should return the empty day state when the day has never been trained", () => {
    expect(dayStateOf(stateWithBenchSets, 3)).toBe(EMPTY_DAY_STATE);
  });
});

describe("completedSetsOf", () => {
  it("should return the completed set indexes for a tracked exercise", () => {
    expect(completedSetsOf(stateWithBenchSets, 1, "bench")).toEqual([0, 2]);
  });

  it("should return no completed sets for an exercise that has never been checked", () => {
    expect(completedSetsOf(stateWithBenchSets, 1, "plank")).toEqual([]);
  });
});

describe("isSetCompleted", () => {
  it("should report a set as completed when its index is stored", () => {
    expect(isSetCompleted(stateWithBenchSets, 1, "bench", 2)).toBe(true);
  });

  it("should report a set as incomplete when its index is absent", () => {
    expect(isSetCompleted(stateWithBenchSets, 1, "bench", 1)).toBe(false);
  });
});

describe("withDayState", () => {
  it("should attach the day state under the day number as a string key", () => {
    const updated = withDayState(EMPTY_WORKOUT_STATE, 2, EMPTY_DAY_STATE);

    expect(updated.days["2"]).toBe(EMPTY_DAY_STATE);
  });

  it("should leave the other days untouched", () => {
    const updated = withDayState(stateWithBenchSets, 2, EMPTY_DAY_STATE);

    expect(updated.days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });

  it("should stamp the current schema version onto the returned state", () => {
    const updated = withDayState(
      { version: 0, days: {}, exercises: {} },
      1,
      EMPTY_DAY_STATE
    );

    expect(updated.version).toBe(WORKOUT_STATE_VERSION);
  });
});

describe("overrideOf", () => {
  it("should return the stored adjustment for an exercise", () => {
    expect(overrideOf(stateWithBenchSets, "bench").weight).toBe("45 kg");
  });

  it("should return no adjustment for an exercise never customised", () => {
    expect(overrideOf(stateWithBenchSets, "squat")).toBe(NO_OVERRIDE);
  });
});

describe("prescriptionOf", () => {
  const programmeDefault = { reps: "5", weight: "40 kg" };

  it("should use the programme reps when they have not been adjusted", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" }).reps
    ).toBe("5");
  });

  it("should use the adjusted weight when one is stored", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" }).weight
    ).toBe("45 kg");
  });

  it("should report the weight as adjusted when one is stored", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" })
        .isWeightAdjusted
    ).toBe(true);
  });

  it("should report the reps as unadjusted when none is stored", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" })
        .isRepsAdjusted
    ).toBe(false);
  });

  it("should fall back entirely to the programme when nothing is adjusted", () => {
    expect(prescriptionOf(programmeDefault, NO_OVERRIDE)).toEqual({
      reps: "5",
      weight: "40 kg",
      isRepsAdjusted: false,
      isWeightAdjusted: false,
    });
  });
});

describe("isEmptyOverride", () => {
  it("should treat an adjustment with no values as empty", () => {
    expect(isEmptyOverride(NO_OVERRIDE)).toBe(true);
  });

  it("should not treat an adjustment carrying a weight as empty", () => {
    expect(isEmptyOverride({ reps: null, weight: "45 kg" })).toBe(false);
  });

  it("should not treat an adjustment carrying reps as empty", () => {
    expect(isEmptyOverride({ reps: "6", weight: null })).toBe(false);
  });
});

describe("withExerciseOverride", () => {
  it("should store an adjustment under the exercise key", () => {
    const updated = withExerciseOverride(EMPTY_WORKOUT_STATE, "bench", {
      reps: null,
      weight: "45 kg",
    });

    expect(updated.exercises["bench"]?.weight).toBe("45 kg");
  });

  it("should remove the exercise entry when the adjustment is emptied", () => {
    const updated = withExerciseOverride(
      stateWithBenchSets,
      "bench",
      NO_OVERRIDE
    );

    expect(updated.exercises).toEqual({});
  });

  it("should leave the recorded days untouched", () => {
    const updated = withExerciseOverride(stateWithBenchSets, "squat", {
      reps: null,
      weight: "60 kg",
    });

    expect(updated.days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });
});

describe("withDayState", () => {
  it("should keep exercise adjustments when a day is replaced", () => {
    const updated = withDayState(stateWithBenchSets, 1, EMPTY_DAY_STATE);

    expect(updated.exercises["bench"]?.weight).toBe("45 kg");
  });
});
