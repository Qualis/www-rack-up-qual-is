import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { ProgramDay } from "@/interfaces/program";
import {
  DayProgress,
  ExerciseValueField,
  WorkoutState,
} from "@/interfaces/workout";
import { GetDayProgressUseCase } from "../use-cases/GetDayProgress";
import { SetExerciseValueUseCase } from "../use-cases/SetExerciseValue";
import { SetSetValueUseCase } from "../use-cases/SetSetValue";
import { ResetDayProgressUseCase } from "../use-cases/ResetDayProgress";
import { ToggleSetCompletionUseCase } from "../use-cases/ToggleSetCompletion";

export class WorkoutSessionService {
  private readonly getDayProgressUseCase: GetDayProgressUseCase;
  private readonly toggleSetCompletionUseCase: ToggleSetCompletionUseCase;
  private readonly resetDayProgressUseCase: ResetDayProgressUseCase;
  private readonly setExerciseValueUseCase: SetExerciseValueUseCase;
  private readonly setSetValueUseCase: SetSetValueUseCase;

  constructor(
    private readonly workoutStateRepository: IWorkoutStateRepository
  ) {
    this.getDayProgressUseCase = new GetDayProgressUseCase();
    this.toggleSetCompletionUseCase = new ToggleSetCompletionUseCase(
      workoutStateRepository
    );
    this.resetDayProgressUseCase = new ResetDayProgressUseCase(
      workoutStateRepository
    );
    this.setExerciseValueUseCase = new SetExerciseValueUseCase(
      workoutStateRepository
    );
    this.setSetValueUseCase = new SetSetValueUseCase(workoutStateRepository);
  }

  loadState(): WorkoutState {
    return this.workoutStateRepository.load();
  }

  subscribeToState(onExternalChange: () => void): () => void {
    return this.workoutStateRepository.subscribe(onExternalChange);
  }

  hasPersistenceFailed(): boolean {
    return this.workoutStateRepository.hasPersistenceFailed();
  }

  getDayProgress(day: ProgramDay, state: WorkoutState): DayProgress {
    return this.getDayProgressUseCase.execute(day, state);
  }

  toggleSetCompletion(
    dayNumber: number,
    exerciseKey: string,
    setIndex: number,
    isoDate: string
  ): WorkoutState {
    return this.toggleSetCompletionUseCase.execute(
      dayNumber,
      exerciseKey,
      setIndex,
      isoDate
    );
  }

  resetDayProgress(dayNumber: number): WorkoutState {
    return this.resetDayProgressUseCase.execute(dayNumber);
  }

  setExerciseValue(
    exerciseKey: string,
    field: ExerciseValueField,
    value: string,
    programmeDefault: string
  ): WorkoutState {
    return this.setExerciseValueUseCase.execute(
      exerciseKey,
      field,
      value,
      programmeDefault
    );
  }

  setSetValue(
    exerciseKey: string,
    setIndex: number,
    field: ExerciseValueField,
    value: string,
    exerciseValue: string
  ): WorkoutState {
    return this.setSetValueUseCase.execute(
      exerciseKey,
      setIndex,
      field,
      value,
      exerciseValue
    );
  }
}
