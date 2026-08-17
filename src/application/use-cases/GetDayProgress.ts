import { ProgramDay } from "@/interfaces/program";
import {
  DayProgress,
  ExerciseProgress,
  WorkoutState,
} from "@/interfaces/workout";
import { setCountFrom } from "@/lib/setCount";
import { completedSetsOf } from "@/lib/workoutState";

export class GetDayProgressUseCase {
  execute(day: ProgramDay, state: WorkoutState): DayProgress {
    const exercises: ExerciseProgress[] = day.exercises.map((exercise) => {
      const totalSets = setCountFrom(exercise.sets);

      return {
        exerciseKey: exercise.key,
        name: exercise.name,
        completedSets: completedSetsOf(state, day.day, exercise.key).filter(
          (setIndex) => setIndex < totalSets
        ).length,
        totalSets,
      };
    });

    return {
      dayNumber: day.day,
      completedSets: exercises.reduce(
        (total, exercise) => total + exercise.completedSets,
        0
      ),
      totalSets: exercises.reduce(
        (total, exercise) => total + exercise.totalSets,
        0
      ),
      exercises,
    };
  }
}
