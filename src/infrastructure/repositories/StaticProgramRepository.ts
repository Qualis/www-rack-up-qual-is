import { IProgramRepository } from "@/domain/repositories/IProgramRepository";
import { Program } from "@/interfaces/program";
import programData from "@/data/program.json";

export class StaticProgramRepository implements IProgramRepository {
  getProgram(): Program {
    return programData as Program;
  }
}
