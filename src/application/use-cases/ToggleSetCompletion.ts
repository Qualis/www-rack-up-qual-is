import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { WorkoutState } from "@/interfaces/workout";
import { completedSetsOf, dayStateOf, withDayState } from "@/lib/workoutState";

export class ToggleSetCompletionUseCase {
  constructor(
    private readonly workoutStateRepository: IWorkoutStateRepository
  ) {}

  execute(
    dayNumber: number,
    exerciseKey: string,
    setIndex: number,
    isoDate: string
  ): WorkoutState {
    const state = this.workoutStateRepository.load();
    const completed = completedSetsOf(state, dayNumber, exerciseKey);
    const nextCompleted = completed.includes(setIndex)
      ? completed.filter((index) => index !== setIndex)
      : [...completed, setIndex].sort((left, right) => left - right);

    const nextState = withDayState(state, dayNumber, {
      lastActiveDate: isoDate,
      completedSets: {
        ...dayStateOf(state, dayNumber).completedSets,
        [exerciseKey]: nextCompleted,
      },
    });

    this.workoutStateRepository.save(nextState);

    return nextState;
  }
}
