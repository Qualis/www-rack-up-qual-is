import { IProgramRepository } from "@/domain/repositories/IProgramRepository";
import { ProgramService } from "@/application/services/ProgramService";
import { StaticProgramRepository } from "@/infrastructure/repositories/StaticProgramRepository";

export interface ProgramDependencies {
  programRepository?: IProgramRepository;
}

export class ProgramContainer {
  private _programRepository?: IProgramRepository;
  private _programService?: ProgramService;

  constructor(private readonly deps?: ProgramDependencies) {}

  getProgramRepository(): IProgramRepository {
    if (!this._programRepository) {
      this._programRepository =
        this.deps?.programRepository ?? new StaticProgramRepository();
    }
    return this._programRepository;
  }

  getProgramService(): ProgramService {
    if (!this._programService) {
      this._programService = new ProgramService(this.getProgramRepository());
    }
    return this._programService;
  }
}

export function createProgramContainer(
  deps?: ProgramDependencies
): ProgramContainer {
  return new ProgramContainer(deps);
}

export const programContainer = createProgramContainer();
