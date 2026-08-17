import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { ExerciseValueField, WorkoutState } from "@/interfaces/workout";
import {
  adjustmentFrom,
  overrideOf,
  setOverrideOf,
  withAdjustedValue,
  withExerciseOverride,
  withSetOverride,
} from "@/lib/workoutState";

export class SetSetValueUseCase {
  constructor(
    private readonly workoutStateRepository: IWorkoutStateRepository
  ) {}

  execute(
    exerciseKey: string,
    setIndex: number,
    field: ExerciseValueField,
    value: string,
    exerciseValue: string
  ): WorkoutState {
    const state = this.workoutStateRepository.load();
    const override = overrideOf(state, exerciseKey);

    const nextState = withExerciseOverride(
      state,
      exerciseKey,
      withSetOverride(
        override,
        setIndex,
        withAdjustedValue(
          setOverrideOf(override, setIndex),
          field,
          adjustmentFrom(value, exerciseValue)
        )
      )
    );

    this.workoutStateRepository.save(nextState);

    return nextState;
  }
}
