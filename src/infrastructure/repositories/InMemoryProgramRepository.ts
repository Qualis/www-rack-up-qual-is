import { IProgramRepository } from "@/domain/repositories/IProgramRepository";
import { Program } from "@/interfaces/program";

const EMPTY_PROGRAM: Program = {
  title: "",
  split: "",
  units: "",
  notes: {},
  schedule: [],
  days: [],
};

export class InMemoryProgramRepository implements IProgramRepository {
  private program: Program = EMPTY_PROGRAM;

  setProgram(program: Program): void {
    this.program = program;
  }

  getProgram(): Program {
    return this.program;
  }
}
