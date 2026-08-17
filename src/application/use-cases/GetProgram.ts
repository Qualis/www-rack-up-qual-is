import { IProgramRepository } from "@/domain/repositories/IProgramRepository";
import { Program } from "@/interfaces/program";

export class GetProgramUseCase {
  constructor(private readonly programRepository: IProgramRepository) {}

  execute(): Program {
    return this.programRepository.getProgram();
  }
}
