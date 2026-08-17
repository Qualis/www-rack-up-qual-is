import { IWorkoutStateRepository } from "@/domain/repositories/IWorkoutStateRepository";
import { WorkoutSessionService } from "@/application/services/WorkoutSessionService";
import { LocalStorageWorkoutStateRepository } from "@/infrastructure/repositories/LocalStorageWorkoutStateRepository";

export interface WorkoutSessionDependencies {
  workoutStateRepository?: IWorkoutStateRepository;
}

export class WorkoutSessionContainer {
  private _workoutStateRepository?: IWorkoutStateRepository;
  private _workoutSessionService?: WorkoutSessionService;

  constructor(private readonly deps?: WorkoutSessionDependencies) {}

  getWorkoutStateRepository(): IWorkoutStateRepository {
    if (!this._workoutStateRepository) {
      this._workoutStateRepository =
        this.deps?.workoutStateRepository ??
        new LocalStorageWorkoutStateRepository();
    }
    return this._workoutStateRepository;
  }

  getWorkoutSessionService(): WorkoutSessionService {
    if (!this._workoutSessionService) {
      this._workoutSessionService = new WorkoutSessionService(
        this.getWorkoutStateRepository()
      );
    }
    return this._workoutSessionService;
  }
}

export function createWorkoutSessionContainer(
  deps?: WorkoutSessionDependencies
): WorkoutSessionContainer {
  return new WorkoutSessionContainer(deps);
}

export const workoutSessionContainer = createWorkoutSessionContainer();
