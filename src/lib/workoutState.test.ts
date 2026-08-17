import { describe, expect, it } from "vitest";
import { WorkoutState } from "@/interfaces/workout";
import {
  adjustmentFrom,
  completedSetsOf,
  dayStateOf,
  effectiveValuesOf,
  EMPTY_DAY_STATE,
  EMPTY_WORKOUT_STATE,
  isEmptyOverride,
  isEmptyValueOverride,
  isSetCompleted,
  NO_OVERRIDE,
  NO_VALUE_OVERRIDE,
  overrideOf,
  prescriptionOf,
  setPrescriptionOf,
  withAdjustedValue,
  withDayState,
  withExerciseOverride,
  withSetOverride,
  WORKOUT_STATE_VERSION,
} from "./workoutState";

const stateWithBenchSets: WorkoutState = {
  version: WORKOUT_STATE_VERSION,
  days: {
    "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0, 2] } },
  },
  exercises: { bench: { reps: "6", weight: "45 kg", sets: {} } },
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
        .value
    ).toBe("5");
  });

  it("should use the adjusted weight when one is stored", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" }).weight
        .value
    ).toBe("45 kg");
  });

  it("should report the weight as adjusted when one is stored", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" }).weight
        .isAdjusted
    ).toBe(true);
  });

  it("should report the reps as unadjusted when none is stored", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" }).reps
        .isAdjusted
    ).toBe(false);
  });

  it("should expose the programme weight as the fallback when the weight is adjusted", () => {
    expect(
      prescriptionOf(programmeDefault, { reps: null, weight: "45 kg" }).weight
        .fallback
    ).toBe("40 kg");
  });

  it("should fall back entirely to the programme when nothing is adjusted", () => {
    expect(
      effectiveValuesOf(prescriptionOf(programmeDefault, NO_OVERRIDE))
    ).toEqual({ reps: "5", weight: "40 kg" });
  });
});

describe("setPrescriptionOf", () => {
  const programmeDefault = { reps: "5", weight: "40 kg" };

  it("should use the set's own weight when that set has been varied", () => {
    const override = withSetOverride(NO_OVERRIDE, 1, {
      reps: null,
      weight: "45 kg",
    });

    expect(setPrescriptionOf(programmeDefault, override, 1).weight.value).toBe(
      "45 kg"
    );
  });

  it("should fall back to the exercise weight when the set has not been varied", () => {
    const override = withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg");

    expect(setPrescriptionOf(programmeDefault, override, 1).weight.value).toBe(
      "42.5 kg"
    );
  });

  it("should fall back to the programme weight when neither the set nor the exercise is adjusted", () => {
    expect(
      setPrescriptionOf(programmeDefault, NO_OVERRIDE, 1).weight.value
    ).toBe("40 kg");
  });

  it("should expose the exercise weight as the fallback when a set has been varied", () => {
    const override = withSetOverride(
      withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
      1,
      { reps: null, weight: "45 kg" }
    );

    expect(
      setPrescriptionOf(programmeDefault, override, 1).weight.fallback
    ).toBe("42.5 kg");
  });

  it("should report a set as unvaried when only the exercise has been adjusted", () => {
    const override = withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg");

    expect(
      setPrescriptionOf(programmeDefault, override, 1).weight.isAdjusted
    ).toBe(false);
  });

  it("should still report a set as varied when its value repeats the exercise value", () => {
    const override = withSetOverride(NO_OVERRIDE, 1, {
      reps: null,
      weight: "40 kg",
    });

    expect(
      setPrescriptionOf(programmeDefault, override, 1).weight.isAdjusted
    ).toBe(true);
  });

  it("should leave the other sets on the programme value when one set is varied", () => {
    const override = withSetOverride(NO_OVERRIDE, 1, {
      reps: null,
      weight: "45 kg",
    });

    expect(setPrescriptionOf(programmeDefault, override, 0).weight.value).toBe(
      "40 kg"
    );
  });
});

describe("adjustmentFrom", () => {
  it("should record a value that differs from the fallback", () => {
    expect(adjustmentFrom("45 kg", "40 kg")).toBe("45 kg");
  });

  it("should trim surrounding whitespace", () => {
    expect(adjustmentFrom("  45 kg  ", "40 kg")).toBe("45 kg");
  });

  it("should record nothing when the value is blank", () => {
    expect(adjustmentFrom("   ", "40 kg")).toBeNull();
  });

  it("should record nothing when the value matches the fallback it was measured against", () => {
    expect(adjustmentFrom("40 kg", "40 kg")).toBeNull();
  });
});

describe("withSetOverride", () => {
  it("should keep the other sets when one set is varied", () => {
    const override = withSetOverride(
      withSetOverride(NO_OVERRIDE, 0, { reps: null, weight: "40 kg" }),
      1,
      { reps: null, weight: "45 kg" }
    );

    expect(Object.keys(override.sets)).toEqual(["0", "1"]);
  });

  it("should remove a set entry once both its values are cleared", () => {
    const override = withSetOverride(
      withSetOverride(NO_OVERRIDE, 1, { reps: null, weight: "45 kg" }),
      1,
      NO_VALUE_OVERRIDE
    );

    expect(override.sets).toEqual({});
  });

  it("should keep the exercise-wide adjustment when a set variation is cleared", () => {
    const adjusted = withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg");

    const override = withSetOverride(adjusted, 1, NO_VALUE_OVERRIDE);

    expect(override.weight).toBe("42.5 kg");
  });
});

describe("withAdjustedValue", () => {
  it("should keep the set variations when the exercise-wide reps are changed", () => {
    const varied = withSetOverride(NO_OVERRIDE, 1, {
      reps: null,
      weight: "45 kg",
    });

    const override = withAdjustedValue(varied, "reps", "6");

    expect(override.sets["1"]?.weight).toBe("45 kg");
  });
});

describe("isEmptyOverride", () => {
  it("should treat an adjustment with no values and no set variations as empty", () => {
    expect(isEmptyOverride(NO_OVERRIDE)).toBe(true);
  });

  it("should not treat an adjustment carrying a weight as empty", () => {
    expect(
      isEmptyOverride(withAdjustedValue(NO_OVERRIDE, "weight", "45 kg"))
    ).toBe(false);
  });

  it("should treat an exercise as empty only once its set variations are gone too", () => {
    const varied = withSetOverride(NO_OVERRIDE, 1, {
      reps: null,
      weight: "45 kg",
    });

    expect(isEmptyOverride(varied)).toBe(false);
  });
});

describe("isEmptyValueOverride", () => {
  it("should treat a set variation with no values as empty", () => {
    expect(isEmptyValueOverride(NO_VALUE_OVERRIDE)).toBe(true);
  });

  it("should not treat a set variation carrying reps as empty", () => {
    expect(isEmptyValueOverride({ reps: "6", weight: null })).toBe(false);
  });
});

describe("withExerciseOverride", () => {
  it("should store an adjustment under the exercise key", () => {
    const updated = withExerciseOverride(
      EMPTY_WORKOUT_STATE,
      "bench",
      withAdjustedValue(NO_OVERRIDE, "weight", "45 kg")
    );

    expect(updated.exercises["bench"]?.weight).toBe("45 kg");
  });

  it("should keep an exercise that still has a set variation when its own values are cleared", () => {
    const varied = withSetOverride(NO_OVERRIDE, 1, {
      reps: null,
      weight: "45 kg",
    });

    const updated = withExerciseOverride(EMPTY_WORKOUT_STATE, "bench", varied);

    expect(updated.exercises["bench"]?.sets["1"]?.weight).toBe("45 kg");
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
    const updated = withExerciseOverride(
      stateWithBenchSets,
      "squat",
      withAdjustedValue(NO_OVERRIDE, "weight", "60 kg")
    );

    expect(updated.days["1"]?.completedSets["bench"]).toEqual([0, 2]);
  });
});

describe("withDayState", () => {
  it("should keep exercise adjustments when a day is replaced", () => {
    const updated = withDayState(stateWithBenchSets, 1, EMPTY_DAY_STATE);

    expect(updated.exercises["bench"]?.weight).toBe("45 kg");
  });
});
