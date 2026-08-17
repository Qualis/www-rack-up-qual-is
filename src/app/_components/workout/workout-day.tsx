"use client";

import { useState } from "react";
import { Exercise, ProgramDay } from "@/interfaces/program";
import {
  DayProgress,
  ExerciseValueField,
  WorkoutState,
} from "@/interfaces/workout";
import { setIndexesFor } from "@/lib/setCount";
import {
  completedSetsOf,
  dayStateOf,
  NEVER_TRAINED,
  overrideOf,
  prescriptionOf,
  setPrescriptionOf,
} from "@/lib/workoutState";
import { WorkoutExercise } from "./workout-exercise";
import { WorkoutWarmUp } from "./workout-warmup";

type Props = {
  day: ProgramDay;
  progress: DayProgress;
  state: WorkoutState;
  restingExerciseKey: string | null;
  onToggleSet: (exercise: Exercise, setIndex: number) => void;
  onStartRest: (exercise: Exercise) => void;
  onResetDay: () => void;
  onSetExerciseValue: (
    exercise: Exercise,
    setIndex: number | null,
    field: ExerciseValueField,
    value: string,
    scopeDescription: string
  ) => void;
  otherDaysNoteFor: (exerciseKey: string) => string;
};

export function WorkoutDay({
  day,
  progress,
  state,
  restingExerciseKey,
  onToggleSet,
  onStartRest,
  onResetDay,
  onSetExerciseValue,
  otherDaysNoteFor,
}: Props) {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const { lastActiveDate } = dayStateOf(state, day.day);
  const completedPercentage =
    progress.totalSets === 0
      ? 0
      : (progress.completedSets / progress.totalSets) * 100;

  const handleResetDay = (): void => {
    onResetDay();
    setIsConfirmingReset(false);
  };

  return (
    <section aria-labelledby={`day-${day.day}-heading`} className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 id={`day-${day.day}-heading`} className="text-3xl font-bold">
            Day {day.day} — {day.name}
          </h2>
          {day.optional && (
            <span className="rounded-full border border-highlight bg-highlight/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-3 dark:text-highlight-dark">
              Optional
            </span>
          )}
        </div>
        <p className="text-accent-3/70 dark:text-accent-1/70">
          {day.focus} · about {day.estimatedMinutes} minutes
        </p>
        {lastActiveDate !== NEVER_TRAINED && (
          <p className="text-sm text-accent-3/60 dark:text-accent-1/60">
            Last trained {lastActiveDate}
          </p>
        )}
      </header>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {progress.completedSets} of {progress.totalSets} sets done
          </p>
          {isConfirmingReset ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDay}
                className="rounded bg-primary px-3 py-2 text-sm text-accent-1 dark:bg-primary-dark"
              >
                Confirm reset
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="rounded border border-primary/40 px-3 py-2 text-sm text-primary dark:text-primary-dark"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingReset(true)}
              className="rounded border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/10 dark:text-primary-dark"
            >
              Reset day
            </button>
          )}
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.totalSets}
          aria-valuenow={progress.completedSets}
          aria-label={`Day ${day.day} progress`}
          className="h-2 w-full overflow-hidden rounded-full bg-primary/15"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 dark:bg-primary-dark"
            style={{ width: `${completedPercentage}%` }}
          />
        </div>
      </div>

      <WorkoutWarmUp warmup={day.warmup} />

      <ol className="space-y-4">
        {day.exercises.map((exercise) => (
          <li key={exercise.key}>
            <WorkoutExercise
              exercise={exercise}
              dayNumber={day.day}
              prescription={prescriptionOf(
                exercise,
                overrideOf(state, exercise.key)
              )}
              setPrescriptions={setIndexesFor(exercise.sets).map((setIndex) =>
                setPrescriptionOf(
                  exercise,
                  overrideOf(state, exercise.key),
                  setIndex
                )
              )}
              completedSets={completedSetsOf(state, day.day, exercise.key)}
              isResting={restingExerciseKey === exercise.key}
              otherDaysNote={otherDaysNoteFor(exercise.key)}
              onToggleSet={(setIndex) => onToggleSet(exercise, setIndex)}
              onStartRest={() => onStartRest(exercise)}
              onSetValue={(setIndex, field, value, scopeDescription) =>
                onSetExerciseValue(
                  exercise,
                  setIndex,
                  field,
                  value,
                  scopeDescription
                )
              }
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
