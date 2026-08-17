import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { completedSetsOf } from "@/lib/workoutState";
import { ResetDayProgressUseCase } from "./ResetDayProgress";
import { ToggleSetCompletionUseCase } from "./ToggleSetCompletion";

describe("ResetDayProgressUseCase", () => {
  let repository: InMemoryWorkoutStateRepository;
  let toggleSetCompletion: ToggleSetCompletionUseCase;
  let useCase: ResetDayProgressUseCase;

  beforeEach(() => {
    repository = new InMemoryWorkoutStateRepository();
    toggleSetCompletion = new ToggleSetCompletionUseCase(repository);
    useCase = new ResetDayProgressUseCase(repository);
  });

  it("should clear every completed set on the day", () => {
    toggleSetCompletion.execute(1, "bench", 0, "2026-08-16");
    toggleSetCompletion.execute(1, "plank", 1, "2026-08-16");

    const state = useCase.execute(1);

    expect(state.days["1"]?.completedSets).toEqual({});
  });

  it("should leave other days untouched", () => {
    toggleSetCompletion.execute(2, "pullup", 0, "2026-08-16");

    const state = useCase.execute(1);

    expect(completedSetsOf(state, 2, "pullup")).toEqual([0]);
  });

  it("should keep the record of when the day was last trained", () => {
    toggleSetCompletion.execute(1, "bench", 0, "2026-08-16");

    const state = useCase.execute(1);

    expect(state.days["1"]?.lastActiveDate).toBe("2026-08-16");
  });

  it("should report the day as never trained when it had no stored progress", () => {
    const state = useCase.execute(3);

    expect(state.days["3"]?.lastActiveDate).toBe("");
  });

  it("should persist the cleared state so it survives a reload", () => {
    toggleSetCompletion.execute(1, "bench", 0, "2026-08-16");

    useCase.execute(1);

    expect(completedSetsOf(repository.load(), 1, "bench")).toEqual([]);
  });
});
