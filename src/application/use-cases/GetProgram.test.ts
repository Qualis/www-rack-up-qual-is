import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProgramRepository } from "@/infrastructure/repositories/InMemoryProgramRepository";
import { GetProgramUseCase } from "./GetProgram";

describe("GetProgramUseCase", () => {
  let repository: InMemoryProgramRepository;
  let useCase: GetProgramUseCase;

  beforeEach(() => {
    repository = new InMemoryProgramRepository();
    useCase = new GetProgramUseCase(repository);
  });

  it("should return the program held by the repository", () => {
    repository.setProgram({
      title: "Home Strength Program",
      split: "Push / Pull / Legs",
      units: "kg",
      notes: {},
      schedule: [],
      days: [],
    });

    expect(useCase.execute().title).toBe("Home Strength Program");
  });
});
