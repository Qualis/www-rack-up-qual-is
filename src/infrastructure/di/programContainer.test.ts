import { describe, expect, it } from "vitest";
import { InMemoryProgramRepository } from "@/infrastructure/repositories/InMemoryProgramRepository";
import { StaticProgramRepository } from "@/infrastructure/repositories/StaticProgramRepository";
import { createProgramContainer, programContainer } from "./programContainer";

describe("ProgramContainer", () => {
  it("should provide the static program repository by default", () => {
    expect(createProgramContainer().getProgramRepository()).toBeInstanceOf(
      StaticProgramRepository
    );
  });

  it("should use an injected program repository when one is supplied", () => {
    const programRepository = new InMemoryProgramRepository();

    const container = createProgramContainer({ programRepository });

    expect(container.getProgramRepository()).toBe(programRepository);
  });

  it("should reuse the same program repository across calls", () => {
    const container = createProgramContainer();

    expect(container.getProgramRepository()).toBe(
      container.getProgramRepository()
    );
  });

  it("should reuse the same program service across calls", () => {
    const container = createProgramContainer();

    expect(container.getProgramService()).toBe(container.getProgramService());
  });

  it("should expose a ready-made container serving the four day split", () => {
    expect(programContainer.getProgramService().getProgram().days).toHaveLength(
      4
    );
  });
});
