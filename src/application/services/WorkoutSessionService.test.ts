import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramDay } from "@/interfaces/program";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { completedSetsOf, EMPTY_WORKOUT_STATE } from "@/lib/workoutState";
import { WorkoutSessionService } from "./WorkoutSessionService";

const pushDay: ProgramDay = {
  day: 1,
  name: "Push",
  focus: "Chest",
  optional: false,
  estimatedMinutes: 50,
  warmup: { guidance: "", exercises: [] },
  exercises: [
    {
      key: "bench",
      name: "Barbell Bench Press",
      cue: "",
      sets: "4",
      reps: "5",
      restSeconds: 180,
      restLabel: "3 min",
      weight: "40 kg",
      demoUrl: "",
      illustrationSvg: "",
    },
  ],
};

describe("WorkoutSessionService", () => {
  let repository: InMemoryWorkoutStateRepository;
  let service: WorkoutSessionService;

  beforeEach(() => {
    repository = new InMemoryWorkoutStateRepository();
    service = new WorkoutSessionService(repository);
  });

  it("should expose the persisted state", () => {
    expect(service.loadState().days).toEqual({});
  });

  it("should record a completed set", () => {
    const state = service.toggleSetCompletion(1, "bench", 0, "2026-08-16");

    expect(completedSetsOf(state, 1, "bench")).toEqual([0]);
  });

  it("should clear a day", () => {
    service.toggleSetCompletion(1, "bench", 0, "2026-08-16");

    const state = service.resetDayProgress(1);

    expect(completedSetsOf(state, 1, "bench")).toEqual([]);
  });

  it("should report progress for a day", () => {
    const state = service.toggleSetCompletion(1, "bench", 0, "2026-08-16");

    expect(service.getDayProgress(pushDay, state).completedSets).toBe(1);
  });

  it("should report the full set count for a day", () => {
    expect(service.getDayProgress(pushDay, EMPTY_WORKOUT_STATE).totalSets).toBe(
      4
    );
  });

  it("should record an adjusted exercise weight", () => {
    const state = service.setExerciseValue(
      "bench",
      "weight",
      "42.5 kg",
      "40 kg"
    );

    expect(state.exercises["bench"]?.weight).toBe("42.5 kg");
  });

  it("should drop an adjustment that matches the programme default", () => {
    service.setExerciseValue("bench", "weight", "42.5 kg", "40 kg");

    const state = service.setExerciseValue("bench", "weight", "40 kg", "40 kg");

    expect(state.exercises).toEqual({});
  });

  it("should record a varied weight for a single set", () => {
    const state = service.setSetValue("bench", 1, "weight", "45 kg", "40 kg");

    expect(state.exercises["bench"]?.sets["1"]?.weight).toBe("45 kg");
  });

  it("should drop a set variation that matches the exercise value", () => {
    service.setSetValue("bench", 1, "weight", "45 kg", "40 kg");

    const state = service.setSetValue("bench", 1, "weight", "40 kg", "40 kg");

    expect(state.exercises).toEqual({});
  });

  it("should expose whether progress could be persisted", () => {
    expect(service.hasPersistenceFailed()).toBe(false);
  });

  it("should notify subscribers when another tab changes the stored progress", () => {
    const listener = vi.fn();
    service.subscribeToState(listener);

    repository.notifyExternalChange(EMPTY_WORKOUT_STATE);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
