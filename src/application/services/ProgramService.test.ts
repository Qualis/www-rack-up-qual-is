import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryProgramRepository } from "@/infrastructure/repositories/InMemoryProgramRepository";
import { ProgramService } from "./ProgramService";

describe("ProgramService", () => {
  let repository: InMemoryProgramRepository;
  let service: ProgramService;

  beforeEach(() => {
    repository = new InMemoryProgramRepository();
    service = new ProgramService(repository);
  });

  it("should expose the program held by the repository", () => {
    repository.setProgram({
      title: "Home Strength Program",
      split: "Push / Pull / Legs",
      units: "kg",
      notes: {},
      schedule: [],
      days: [],
    });

    expect(service.getProgram().title).toBe("Home Strength Program");
  });
});
