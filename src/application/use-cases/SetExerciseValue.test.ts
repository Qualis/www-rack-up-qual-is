import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { overrideOf } from "@/lib/workoutState";
import { SetExerciseValueUseCase } from "./SetExerciseValue";
import { SetSetValueUseCase } from "./SetSetValue";

describe("SetExerciseValueUseCase", () => {
  let repository: InMemoryWorkoutStateRepository;
  let useCase: SetExerciseValueUseCase;

  beforeEach(() => {
    repository = new InMemoryWorkoutStateRepository();
    useCase = new SetExerciseValueUseCase(repository);
  });

  it("should record an adjusted weight", () => {
    const state = useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    expect(overrideOf(state, "bench").weight).toBe("42.5 kg");
  });

  it("should record an adjusted rep count", () => {
    const state = useCase.execute("bench", "reps", "6", "5");

    expect(overrideOf(state, "bench").reps).toBe("6");
  });

  it("should leave the reps untouched when only the weight is adjusted", () => {
    const state = useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    expect(overrideOf(state, "bench").reps).toBeNull();
  });

  it("should keep an existing weight adjustment when the reps are adjusted", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    const state = useCase.execute("bench", "reps", "6", "5");

    expect(overrideOf(state, "bench").weight).toBe("42.5 kg");
  });

  it("should trim surrounding whitespace before recording an adjustment", () => {
    const state = useCase.execute("bench", "weight", "  42.5 kg  ", "40 kg");

    expect(overrideOf(state, "bench").weight).toBe("42.5 kg");
  });

  it("should drop the adjustment when the submitted value is blank", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    const state = useCase.execute("bench", "weight", "", "40 kg");

    expect(overrideOf(state, "bench").weight).toBeNull();
  });

  it("should drop the adjustment when the submitted value matches the programme default", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    const state = useCase.execute("bench", "weight", "40 kg", "40 kg");

    expect(overrideOf(state, "bench").weight).toBeNull();
  });

  it("should forget the exercise entirely once every adjustment is dropped", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    const state = useCase.execute("bench", "weight", "", "40 kg");

    expect(state.exercises).toEqual({});
  });

  it("should keep the exercise while another field is still adjusted", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");
    useCase.execute("bench", "reps", "6", "5");

    const state = useCase.execute("bench", "weight", "", "40 kg");

    expect(state.exercises["bench"]).toEqual({
      reps: "6",
      weight: null,
      sets: {},
    });
  });

  it("should leave other exercises untouched", () => {
    useCase.execute("squat", "weight", "60 kg", "40 kg");

    const state = useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    expect(overrideOf(state, "squat").weight).toBe("60 kg");
  });

  it("should apply the adjustment to the exercise wherever it appears in the programme", () => {
    const state = useCase.execute(
      "dbpress",
      "weight",
      "12.5 kg ea",
      "10 kg ea"
    );

    expect(state.exercises["dbpress"]?.weight).toBe("12.5 kg ea");
  });

  it("should persist the adjustment so it survives a reload", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    expect(overrideOf(repository.load(), "bench").weight).toBe("42.5 kg");
  });

  it("should keep a set's variation when the exercise-wide value is reset", () => {
    useCase.execute("bench", "weight", "42.5 kg", "40 kg");
    new SetSetValueUseCase(repository).execute(
      "bench",
      1,
      "weight",
      "45 kg",
      "42.5 kg"
    );

    const state = useCase.execute("bench", "weight", "", "40 kg");

    expect(state.exercises["bench"]?.sets["1"]?.weight).toBe("45 kg");
  });

  it("should keep a set's variation when the exercise-wide reps are adjusted", () => {
    new SetSetValueUseCase(repository).execute(
      "bench",
      1,
      "weight",
      "45 kg",
      "40 kg"
    );

    const state = useCase.execute("bench", "reps", "6", "5");

    expect(state.exercises["bench"]?.sets["1"]?.weight).toBe("45 kg");
  });

  it("should leave completed sets untouched when an adjustment is recorded", () => {
    repository.save({
      version: 3,
      days: {
        "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0] } },
      },
      exercises: {},
    });

    const state = useCase.execute("bench", "weight", "42.5 kg", "40 kg");

    expect(state.days["1"]?.completedSets["bench"]).toEqual([0]);
  });
});
