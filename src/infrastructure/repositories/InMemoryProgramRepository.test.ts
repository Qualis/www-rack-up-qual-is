import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProgramRepository } from "./InMemoryProgramRepository";

describe("InMemoryProgramRepository", () => {
  let repository: InMemoryProgramRepository;

  beforeEach(() => {
    repository = new InMemoryProgramRepository();
  });

  it("should return an empty program before one is provided", () => {
    expect(repository.getProgram().days).toEqual([]);
  });

  it("should return the program it was given", () => {
    repository.setProgram({
      title: "Test Program",
      split: "",
      units: "kg",
      notes: {},
      schedule: [],
      days: [],
    });

    expect(repository.getProgram().title).toBe("Test Program");
  });
});
