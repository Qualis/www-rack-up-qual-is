import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkoutState } from "@/interfaces/workout";
import { WORKOUT_STATE_VERSION } from "@/lib/workoutState";
import { InMemoryWorkoutStateRepository } from "./InMemoryWorkoutStateRepository";

const stateWithBench: WorkoutState = {
  version: WORKOUT_STATE_VERSION,
  days: {
    "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0] } },
  },
  exercises: {},
};

describe("InMemoryWorkoutStateRepository", () => {
  let repository: InMemoryWorkoutStateRepository;

  beforeEach(() => {
    repository = new InMemoryWorkoutStateRepository();
  });

  it("should start with no recorded days", () => {
    expect(repository.load().days).toEqual({});
  });

  it("should return the state it was given", () => {
    repository.save(stateWithBench);

    expect(repository.load()).toBe(stateWithBench);
  });

  it("should never report a persistence failure because it cannot fail", () => {
    expect(repository.hasPersistenceFailed()).toBe(false);
  });

  it("should notify subscribers when state is saved", () => {
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.save(stateWithBench);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should notify subscribers when an external change arrives", () => {
    const listener = vi.fn();
    repository.subscribe(listener);

    repository.notifyExternalChange(stateWithBench);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should adopt the state carried by an external change", () => {
    repository.notifyExternalChange(stateWithBench);

    expect(repository.load()).toBe(stateWithBench);
  });

  it("should stop notifying once unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);

    unsubscribe();
    repository.notifyExternalChange(stateWithBench);

    expect(listener).not.toHaveBeenCalled();
  });
});
