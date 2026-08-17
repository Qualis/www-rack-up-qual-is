import { describe, expect, it } from "vitest";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { LocalStorageWorkoutStateRepository } from "@/infrastructure/repositories/LocalStorageWorkoutStateRepository";
import {
  createWorkoutSessionContainer,
  workoutSessionContainer,
} from "./workoutSessionContainer";

describe("WorkoutSessionContainer", () => {
  it("should provide the localStorage state repository by default", () => {
    expect(
      createWorkoutSessionContainer().getWorkoutStateRepository()
    ).toBeInstanceOf(LocalStorageWorkoutStateRepository);
  });

  it("should use an injected state repository when one is supplied", () => {
    const workoutStateRepository = new InMemoryWorkoutStateRepository();

    const container = createWorkoutSessionContainer({ workoutStateRepository });

    expect(container.getWorkoutStateRepository()).toBe(workoutStateRepository);
  });

  it("should reuse the same state repository across calls", () => {
    const container = createWorkoutSessionContainer();

    expect(container.getWorkoutStateRepository()).toBe(
      container.getWorkoutStateRepository()
    );
  });

  it("should reuse the same session service across calls", () => {
    const container = createWorkoutSessionContainer();

    expect(container.getWorkoutSessionService()).toBe(
      container.getWorkoutSessionService()
    );
  });

  it("should expose a ready-made container for the application to use", () => {
    expect(
      workoutSessionContainer.getWorkoutSessionService().loadState().days
    ).toEqual({});
  });
});
