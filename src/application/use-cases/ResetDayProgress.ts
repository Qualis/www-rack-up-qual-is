import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { WorkoutState } from "@/interfaces/workout";
import { dayStateOf, withDayState } from "@/lib/workoutState";

export class ResetDayProgressUseCase {
  constructor(
    private readonly workoutStateRepository: IWorkoutStateRepository
  ) {}

  execute(dayNumber: number): WorkoutState {
    const state = this.workoutStateRepository.load();

    const nextState = withDayState(state, dayNumber, {
      lastActiveDate: dayStateOf(state, dayNumber).lastActiveDate,
      completedSets: {},
    });

    this.workoutStateRepository.save(nextState);

    return nextState;
  }
}
