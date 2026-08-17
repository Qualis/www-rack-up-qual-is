"use client";

import { useState } from "react";
import cn from "classnames";
import { Exercise } from "@/interfaces/program";
import { ExercisePrescription, ExerciseValueField } from "@/interfaces/workout";
import { setIndexesFor } from "@/lib/setCount";
import { DemoLink } from "./demo-link";
import { ExerciseValueEditor } from "./exercise-value-editor";
import { WorkoutIllustration } from "./workout-illustration";

type Props = {
  exercise: Exercise;
  dayNumber: number;
  prescription: ExercisePrescription;
  completedSets: readonly number[];
  isResting: boolean;
  otherDaysNote: string;
  onToggleSet: (setIndex: number) => void;
  onStartRest: () => void;
  onSetValue: (field: ExerciseValueField, value: string) => void;
};

export function WorkoutExercise({
  exercise,
  dayNumber,
  prescription,
  completedSets,
  isResting,
  otherDaysNote,
  onToggleSet,
  onStartRest,
  onSetValue,
}: Props) {
  const [editingField, setEditingField] = useState<ExerciseValueField | null>(
    null
  );
  const [fieldToRefocus, setFieldToRefocus] =
    useState<ExerciseValueField | null>(null);
  const setIndexes = setIndexesFor(exercise.sets);

  const closeEditor = (field: ExerciseValueField): void => {
    setEditingField(null);
    setFieldToRefocus(field);
  };

  const renderAdjustableValue = (
    field: ExerciseValueField,
    label: string,
    value: string,
    programmeDefault: string,
    isAdjusted: boolean
  ) => {
    const fieldId = `day-${dayNumber}-${exercise.key}-${field}`;

    if (editingField === field) {
      return (
        <div className="flex items-center gap-2">
          <dt className="text-accent-3/60 dark:text-accent-1/60">{label}</dt>
          <dd className="min-w-0 flex-1">
            <ExerciseValueEditor
              exerciseName={exercise.name}
              field={field}
              label={label}
              value={value}
              programmeDefault={programmeDefault}
              fieldId={fieldId}
              otherDaysNote={otherDaysNote}
              onCommit={(committed) => onSetValue(field, committed)}
              onDone={() => closeEditor(field)}
            />
          </dd>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <dt className="text-accent-3/60 dark:text-accent-1/60">{label}</dt>
        <dd className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            autoFocus={fieldToRefocus === field}
            onClick={() => setEditingField(field)}
            className="min-h-[44px] rounded border border-dashed border-primary px-3 font-medium hover:bg-primary/5 dark:border-primary-dark"
          >
            {value}
            <span className="sr-only">
              {" "}
              — change {field} for {exercise.name}
            </span>
          </button>
          {isAdjusted && (
            <button
              type="button"
              onClick={() => onSetValue(field, "")}
              className="min-h-[44px] px-2 text-xs text-accent-3/70 underline underline-offset-2 dark:text-accent-1/70"
            >
              was {programmeDefault}
              <span className="sr-only">
                {" "}
                — reset {field} for {exercise.name} to the programme default
              </span>
            </button>
          )}
        </dd>
      </div>
    );
  };

  return (
    <article
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isResting
          ? "border-primary dark:border-primary-dark"
          : "border-primary/15"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[14rem] flex-1">
          <h3 className="text-lg font-bold">{exercise.name}</h3>
          <p className="text-sm text-accent-3/70 dark:text-accent-1/70">
            {exercise.cue}
          </p>
          <dl className="mt-2 flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-accent-3/60 dark:text-accent-1/60">Sets</dt>
              <dd className="font-medium">{exercise.sets}</dd>
            </div>
            {renderAdjustableValue(
              "reps",
              "Reps",
              prescription.reps,
              exercise.reps,
              prescription.isRepsAdjusted
            )}
            {renderAdjustableValue(
              "weight",
              "Weight",
              prescription.weight,
              exercise.weight,
              prescription.isWeightAdjusted
            )}
            <div className="flex items-center gap-2">
              <dt className="text-accent-3/60 dark:text-accent-1/60">Rest</dt>
              <dd className="font-medium">{exercise.restLabel}</dd>
            </div>
          </dl>
          <div className="mt-2">
            <DemoLink href={exercise.demoUrl} exerciseName={exercise.name} />
          </div>
        </div>
        <WorkoutIllustration markup={exercise.illustrationSvg} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {setIndexes.map((setIndex) => (
          <label
            key={setIndex}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm",
              completedSets.includes(setIndex)
                ? "border-primary bg-primary/10 font-medium text-primary dark:border-primary-dark dark:text-primary-dark"
                : "border-primary/20 hover:bg-primary/5"
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#1E40AF]"
              checked={completedSets.includes(setIndex)}
              onChange={() => onToggleSet(setIndex)}
              aria-label={`${exercise.name} set ${setIndex + 1}`}
            />
            Set {setIndex + 1}
          </label>
        ))}
        <button
          type="button"
          onClick={onStartRest}
          className="rounded border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/10 dark:text-primary-dark"
        >
          Rest {exercise.restLabel}
          <span className="sr-only"> after {exercise.name}</span>
        </button>
      </div>
    </article>
  );
}
