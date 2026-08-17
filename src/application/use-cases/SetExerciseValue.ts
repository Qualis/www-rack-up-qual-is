import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import {
  ExerciseOverride,
  ExerciseValueField,
  WorkoutState,
} from "@/interfaces/workout";
import { overrideOf, withExerciseOverride } from "@/lib/workoutState";

export class SetExerciseValueUseCase {
  constructor(
    private readonly workoutStateRepository: IWorkoutStateRepository
  ) {}

  execute(
    exerciseKey: string,
    field: ExerciseValueField,
    value: string,
    programmeDefault: string
  ): WorkoutState {
    const state = this.workoutStateRepository.load();
    const current = overrideOf(state, exerciseKey);
    const trimmed = value.trim();
    const adjusted =
      trimmed === "" || trimmed === programmeDefault.trim() ? null : trimmed;

    const next: ExerciseOverride =
      field === "reps"
        ? { reps: adjusted, weight: current.weight }
        : { reps: current.reps, weight: adjusted };

    const nextState = withExerciseOverride(state, exerciseKey, next);

    this.workoutStateRepository.save(nextState);

    return nextState;
  }
}
