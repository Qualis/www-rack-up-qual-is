import { IProgramRepository } from "@/domain/repositories/IProgramRepository";
import { Program } from "@/interfaces/program";
import { GetProgramUseCase } from "../use-cases/GetProgram";

export class ProgramService {
  private readonly getProgramUseCase: GetProgramUseCase;

  constructor(programRepository: IProgramRepository) {
    this.getProgramUseCase = new GetProgramUseCase(programRepository);
  }

  getProgram(): Program {
    return this.getProgramUseCase.execute();
  }
}
