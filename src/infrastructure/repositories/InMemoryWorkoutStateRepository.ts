import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { WorkoutState } from "@/interfaces/workout";
import { EMPTY_WORKOUT_STATE } from "@/lib/workoutState";

export class InMemoryWorkoutStateRepository implements IWorkoutStateRepository {
  private state: WorkoutState = EMPTY_WORKOUT_STATE;
  private listeners: Set<() => void> = new Set();

  load(): WorkoutState {
    return this.state;
  }

  save(state: WorkoutState): void {
    this.state = state;
    this.notifyListeners();
  }

  hasPersistenceFailed(): boolean {
    return false;
  }

  subscribe(onChange: () => void): () => void {
    this.listeners.add(onChange);

    return () => {
      this.listeners.delete(onChange);
    };
  }

  notifyExternalChange(state: WorkoutState): void {
    this.state = state;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}
