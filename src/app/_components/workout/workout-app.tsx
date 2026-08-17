"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import cn from "classnames";
import { Exercise, Program } from "@/interfaces/program";
import { ExerciseValueField, RestTimer } from "@/interfaces/workout";
import { WorkoutSessionService } from "@/application/services/WorkoutSessionService";
import { workoutSessionContainer } from "@/infrastructure/di/workoutSessionContainer";
import { todayIsoDate } from "@/lib/calendarDate";
import { createRestAlert, RestAlert } from "@/lib/restAlert";
import {
  describeOtherDays,
  otherDaysWithExercise,
} from "@/lib/programExercises";
import { deadlineFromNow } from "@/lib/restTimer";
import {
  EMPTY_WORKOUT_STATE,
  isSetCompleted,
  overrideOf,
  prescriptionOf,
} from "@/lib/workoutState";
import { RestTimerPanel } from "./rest-timer-panel";
import { WorkoutDay } from "./workout-day";
import { WorkoutOverview } from "./workout-overview";

const COMPLETION_FLASH_MILLISECONDS = 4000;
const REST_COMPLETE_MESSAGE = "Rest complete — next set";
const STORAGE_BLOCKED_MESSAGE =
  "Progress cannot be saved in this browser, so your sets and any reps or weight changes will be lost when you reload.";

const defaultSessionService =
  workoutSessionContainer.getWorkoutSessionService();
const defaultRestAlert = createRestAlert();
const emptyStateSnapshot = () => EMPTY_WORKOUT_STATE;

function signalWithoutInterruptingTheWorkout(restAlert: RestAlert): void {
  try {
    restAlert.signal();
  } catch {
    return;
  }
}

type Props = {
  program: Program;
  sessionService?: WorkoutSessionService;
  restAlert?: RestAlert;
};

export function WorkoutApp({
  program,
  sessionService = defaultSessionService,
  restAlert = defaultRestAlert,
}: Props) {
  const [activeDayNumber, setActiveDayNumber] = useState(
    program.days[0]?.day ?? 1
  );
  const [restTimer, setRestTimer] = useState<RestTimer | null>(null);
  const [hasJustFinishedRest, setHasJustFinishedRest] = useState(false);
  const [adjustmentAnnouncement, setAdjustmentAnnouncement] = useState("");

  const subscribeToState = useCallback(
    (onChange: () => void) => sessionService.subscribeToState(onChange),
    [sessionService]
  );
  const readState = useCallback(
    () => sessionService.loadState(),
    [sessionService]
  );
  const state = useSyncExternalStore(
    subscribeToState,
    readState,
    emptyStateSnapshot
  );

  useEffect(() => {
    if (!hasJustFinishedRest) {
      return undefined;
    }

    const timeoutId = setTimeout(
      () => setHasJustFinishedRest(false),
      COMPLETION_FLASH_MILLISECONDS
    );

    return () => clearTimeout(timeoutId);
  }, [hasJustFinishedRest]);

  const handleRestExpire = useCallback(() => {
    setRestTimer(null);
    setHasJustFinishedRest(true);
    signalWithoutInterruptingTheWorkout(restAlert);
  }, [restAlert]);

  const handleSkipRest = useCallback(() => {
    setRestTimer(null);
  }, []);

  const activeDay = program.days.find((day) => day.day === activeDayNumber);

  if (!activeDay) {
    return null;
  }

  const startRestFor = (dayNumber: number, exercise: Exercise): void => {
    restAlert.prepare();
    setHasJustFinishedRest(false);
    setRestTimer({
      dayNumber,
      exerciseKey: exercise.key,
      exerciseName: exercise.name,
      durationSeconds: exercise.restSeconds,
      endsAt: deadlineFromNow(exercise.restSeconds),
    });
  };

  const restartRest = (timer: RestTimer): void => {
    restAlert.prepare();
    setHasJustFinishedRest(false);
    setRestTimer({
      ...timer,
      endsAt: deadlineFromNow(timer.durationSeconds),
    });
  };

  const handleToggleSet = (exercise: Exercise, setIndex: number): void => {
    const wasCompleted = isSetCompleted(
      state,
      activeDay.day,
      exercise.key,
      setIndex
    );

    sessionService.toggleSetCompletion(
      activeDay.day,
      exercise.key,
      setIndex,
      todayIsoDate()
    );

    if (wasCompleted) {
      return;
    }

    startRestFor(activeDay.day, exercise);
  };

  const handleSetExerciseValue = (
    exercise: Exercise,
    field: ExerciseValueField,
    value: string
  ): void => {
    const nextState = sessionService.setExerciseValue(
      exercise.key,
      field,
      value,
      field === "reps" ? exercise.reps : exercise.weight
    );
    const prescription = prescriptionOf(
      exercise,
      overrideOf(nextState, exercise.key)
    );

    setAdjustmentAnnouncement(
      `${exercise.name} ${field} set to ${
        field === "reps" ? prescription.reps : prescription.weight
      }`
    );
  };

  const otherDaysNoteFor = (exerciseKey: string): string => {
    const otherDays = otherDaysWithExercise(
      program,
      exerciseKey,
      activeDay.day
    );

    return otherDays.length === 0 ? "" : describeOtherDays(otherDays);
  };

  const hasPersistenceFailed = sessionService.hasPersistenceFailed();
  const restAnnouncement = hasJustFinishedRest
    ? REST_COMPLETE_MESSAGE
    : restTimer === null
      ? ""
      : `Resting ${restTimer.durationSeconds} seconds after ${restTimer.exerciseName}`;

  return (
    <div className="min-h-screen">
      <p
        role="alert"
        className={cn(
          hasPersistenceFailed
            ? "bg-highlight px-4 py-3 text-center font-bold text-accent-3"
            : "sr-only"
        )}
      >
        {hasPersistenceFailed ? STORAGE_BLOCKED_MESSAGE : ""}
      </p>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <header className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter">
            {program.title}
          </h1>
          <p className="text-accent-3/70 dark:text-accent-1/70">
            {program.split}
          </p>
        </header>

        <nav aria-label="Training days" className="flex flex-wrap gap-2">
          {program.days.map((day) => (
            <button
              key={day.day}
              type="button"
              aria-pressed={day.day === activeDayNumber}
              onClick={() => setActiveDayNumber(day.day)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                day.day === activeDayNumber
                  ? "border-primary bg-primary text-accent-1 dark:border-primary-dark dark:bg-primary-dark"
                  : "border-primary/30 text-primary hover:bg-primary/10 dark:text-primary-dark"
              )}
            >
              Day {day.day} — {day.name}
              {day.optional && <span className="sr-only"> (optional)</span>}
            </button>
          ))}
        </nav>

        <WorkoutDay
          key={activeDay.day}
          day={activeDay}
          progress={sessionService.getDayProgress(activeDay, state)}
          state={state}
          restingExerciseKey={
            restTimer !== null && restTimer.dayNumber === activeDay.day
              ? restTimer.exerciseKey
              : null
          }
          onToggleSet={handleToggleSet}
          onStartRest={(exercise) => startRestFor(activeDay.day, exercise)}
          onResetDay={() => sessionService.resetDayProgress(activeDay.day)}
          onSetExerciseValue={handleSetExerciseValue}
          otherDaysNoteFor={otherDaysNoteFor}
        />

        <WorkoutOverview program={program} />
      </div>

      <p role="status" aria-label="Exercise adjustments" className="sr-only">
        {adjustmentAnnouncement}
      </p>

      <p
        role="status"
        aria-label="Rest timer updates"
        className={cn(
          hasJustFinishedRest
            ? "sticky bottom-0 z-50 bg-highlight px-4 py-3 text-center font-bold text-accent-3"
            : "sr-only"
        )}
      >
        {restAnnouncement}
      </p>

      {restTimer !== null && (
        <RestTimerPanel
          key={restTimer.endsAt}
          timer={restTimer}
          onExpire={handleRestExpire}
          onSkip={handleSkipRest}
          onRestart={() => restartRest(restTimer)}
        />
      )}
    </div>
  );
}
