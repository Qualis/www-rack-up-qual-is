import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { completedSetsOf } from "@/lib/workoutState";
import { ToggleSetCompletionUseCase } from "./ToggleSetCompletion";

describe("ToggleSetCompletionUseCase", () => {
  let repository: InMemoryWorkoutStateRepository;
  let useCase: ToggleSetCompletionUseCase;

  beforeEach(() => {
    repository = new InMemoryWorkoutStateRepository();
    useCase = new ToggleSetCompletionUseCase(repository);
  });

  it("should mark a set as completed when it was not completed before", () => {
    const state = useCase.execute(1, "bench", 0, "2026-08-16");

    expect(completedSetsOf(state, 1, "bench")).toEqual([0]);
  });

  it("should clear a set when it was already completed", () => {
    useCase.execute(1, "bench", 0, "2026-08-16");

    const state = useCase.execute(1, "bench", 0, "2026-08-16");

    expect(completedSetsOf(state, 1, "bench")).toEqual([]);
  });

  it("should keep completed set indexes in ascending order", () => {
    useCase.execute(1, "bench", 2, "2026-08-16");
    useCase.execute(1, "bench", 0, "2026-08-16");

    const state = useCase.execute(1, "bench", 1, "2026-08-16");

    expect(completedSetsOf(state, 1, "bench")).toEqual([0, 1, 2]);
  });

  it("should leave other exercises on the same day untouched", () => {
    useCase.execute(1, "bench", 0, "2026-08-16");

    const state = useCase.execute(1, "plank", 0, "2026-08-16");

    expect(completedSetsOf(state, 1, "bench")).toEqual([0]);
  });

  it("should leave other days untouched", () => {
    useCase.execute(1, "bench", 0, "2026-08-16");

    const state = useCase.execute(2, "pullup", 0, "2026-08-16");

    expect(completedSetsOf(state, 1, "bench")).toEqual([0]);
  });

  it("should record the day the set was trained", () => {
    const state = useCase.execute(1, "bench", 0, "2026-08-16");

    expect(state.days["1"]?.lastActiveDate).toBe("2026-08-16");
  });

  it("should persist the updated state so it survives a reload", () => {
    useCase.execute(1, "bench", 0, "2026-08-16");

    expect(completedSetsOf(repository.load(), 1, "bench")).toEqual([0]);
  });
});
