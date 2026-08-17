import { beforeEach, describe, expect, it } from "vitest";
import { StaticProgramRepository } from "./StaticProgramRepository";

describe("StaticProgramRepository", () => {
  let repository: StaticProgramRepository;

  beforeEach(() => {
    repository = new StaticProgramRepository();
  });

  it("should expose the four days of the push pull legs split", () => {
    expect(repository.getProgram().days).toHaveLength(4);
  });

  it("should mark the fourth day as optional", () => {
    expect(repository.getProgram().days[3]?.optional).toBe(true);
  });

  it("should mark the three core days as not optional", () => {
    const required = repository
      .getProgram()
      .days.filter((day) => !day.optional);

    expect(required).toHaveLength(3);
  });

  it("should expose a warm-up block for every day", () => {
    const withoutWarmUp = repository
      .getProgram()
      .days.filter((day) => day.warmup.exercises.length === 0);

    expect(withoutWarmUp).toEqual([]);
  });

  it("should give every working exercise a rest duration", () => {
    const withoutRest = repository
      .getProgram()
      .days.flatMap((day) => day.exercises)
      .filter((exercise) => typeof exercise.restSeconds !== "number");

    expect(withoutRest).toEqual([]);
  });

  it("should give every working exercise an inline illustration", () => {
    const withoutIllustration = repository
      .getProgram()
      .days.flatMap((day) => day.exercises)
      .filter((exercise) => !exercise.illustrationSvg.startsWith("<svg"));

    expect(withoutIllustration).toEqual([]);
  });

  it("should link every working exercise to an external demo", () => {
    const withoutDemo = repository
      .getProgram()
      .days.flatMap((day) => day.exercises)
      .filter((exercise) => !exercise.demoUrl.startsWith("https://"));

    expect(withoutDemo).toEqual([]);
  });

  it("should expose the weekly schedule", () => {
    expect(repository.getProgram().schedule).toHaveLength(7);
  });

  it("should expose the programme notes", () => {
    expect(Object.keys(repository.getProgram().notes).length).toBeGreaterThan(
      0
    );
  });
});
