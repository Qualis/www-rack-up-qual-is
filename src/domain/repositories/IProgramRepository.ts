import { Program } from "@/interfaces/program";

export interface IProgramRepository {
  getProgram(): Program;
}
