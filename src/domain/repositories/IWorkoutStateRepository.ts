import { WorkoutState } from "@/interfaces/workout";

export interface IWorkoutStateRepository {
  load(): WorkoutState;
  save(state: WorkoutState): void;
  hasPersistenceFailed(): boolean;
  subscribe(onChange: () => void): () => void;
}
