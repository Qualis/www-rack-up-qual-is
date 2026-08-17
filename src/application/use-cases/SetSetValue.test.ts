import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { overrideOf } from "@/lib/workoutState";
import { SetExerciseValueUseCase } from "./SetExerciseValue";
import { SetSetValueUseCase } from "./SetSetValue";

describe("SetSetValueUseCase", () => {
  let repository: InMemoryWorkoutStateRepository;
  let useCase: SetSetValueUseCase;

  beforeEach(() => {
    repository = new InMemoryWorkoutStateRepository();
    useCase = new SetSetValueUseCase(repository);
  });

  it("should record a varied weight for a single set", () => {
    const state = useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    expect(state.exercises["bench"]?.sets["1"]?.weight).toBe("45 kg");
  });

  it("should record a varied rep count for a single set", () => {
    const state = useCase.execute("bench", 1, "reps", "3", "5");

    expect(state.exercises["bench"]?.sets["1"]?.reps).toBe("3");
  });

  it("should leave the exercise-wide weight untouched when one set is varied", () => {
    const state = useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    expect(overrideOf(state, "bench").weight).toBeNull();
  });

  it("should leave the other sets untouched when one set is varied", () => {
    useCase.execute("bench", 0, "weight", "42.5 kg", "40 kg");

    const state = useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    expect(state.exercises["bench"]?.sets["0"]?.weight).toBe("42.5 kg");
  });

  it("should leave the other field of the same set untouched", () => {
    useCase.execute("bench", 1, "reps", "3", "5");

    const state = useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    expect(state.exercises["bench"]?.sets["1"]?.reps).toBe("3");
  });

  it("should drop the variation when the submitted value matches the exercise value", () => {
    useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    const state = useCase.execute("bench", 1, "weight", "40 kg", "40 kg");

    expect(state.exercises).toEqual({});
  });

  it("should drop the variation when the submitted value is blank", () => {
    useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    const state = useCase.execute("bench", 1, "weight", "", "40 kg");

    expect(state.exercises).toEqual({});
  });

  it("should forget the exercise entirely once its last set variation is dropped", () => {
    useCase.execute("bench", 0, "weight", "42.5 kg", "40 kg");
    useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    useCase.execute("bench", 0, "weight", "", "40 kg");
    const state = useCase.execute("bench", 1, "weight", "", "40 kg");

    expect(state.exercises).toEqual({});
  });

  it("should keep the exercise when it still has an exercise-wide adjustment", () => {
    new SetExerciseValueUseCase(repository).execute(
      "bench",
      "weight",
      "42.5 kg",
      "40 kg"
    );
    useCase.execute("bench", 1, "weight", "45 kg", "42.5 kg");

    const state = useCase.execute("bench", 1, "weight", "", "42.5 kg");

    expect(overrideOf(state, "bench").weight).toBe("42.5 kg");
  });

  it("should trim surrounding whitespace before recording a variation", () => {
    const state = useCase.execute("bench", 1, "weight", "  45 kg  ", "40 kg");

    expect(state.exercises["bench"]?.sets["1"]?.weight).toBe("45 kg");
  });

  it("should apply the variation wherever the exercise appears in the programme", () => {
    const state = useCase.execute(
      "dbpress",
      1,
      "weight",
      "12.5 kg ea",
      "10 kg ea"
    );

    expect(state.exercises["dbpress"]?.sets["1"]?.weight).toBe("12.5 kg ea");
  });

  it("should persist the variation so it survives a reload", () => {
    useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    expect(overrideOf(repository.load(), "bench").sets["1"]?.weight).toBe(
      "45 kg"
    );
  });

  it("should leave completed sets untouched when a set variation is recorded", () => {
    repository.save({
      version: 3,
      days: {
        "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0] } },
      },
      exercises: {},
    });

    const state = useCase.execute("bench", 1, "weight", "45 kg", "40 kg");

    expect(state.days["1"]?.completedSets["bench"]).toEqual([0]);
  });
});
