"use client";

import { useState } from "react";
import cn from "classnames";
import { Exercise } from "@/interfaces/program";
import {
  ExercisePrescription,
  ExerciseValueField,
  ResolvedValue,
} from "@/interfaces/workout";
import { DemoLink } from "./demo-link";
import { ExerciseValueEditor } from "./exercise-value-editor";
import { WorkoutIllustration } from "./workout-illustration";

const EVERY_SET = null;

const FIELD_LABELS: Readonly<Record<ExerciseValueField, string>> = {
  reps: "Reps",
  weight: "Weight",
};

type Props = {
  exercise: Exercise;
  dayNumber: number;
  prescription: ExercisePrescription;
  setPrescriptions: readonly ExercisePrescription[];
  completedSets: readonly number[];
  isResting: boolean;
  otherDaysNote: string;
  onToggleSet: (setIndex: number) => void;
  onStartRest: () => void;
  onSetValue: (
    setIndex: number | null,
    field: ExerciseValueField,
    value: string,
    scopeDescription: string
  ) => void;
};

export function WorkoutExercise({
  exercise,
  dayNumber,
  prescription,
  setPrescriptions,
  completedSets,
  isResting,
  otherDaysNote,
  onToggleSet,
  onStartRest,
  onSetValue,
}: Props) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [refocusKey, setRefocusKey] = useState<string | null>(null);

  const renderValue = (
    setIndex: number | null,
    field: ExerciseValueField,
    resolved: ResolvedValue
  ) => {
    const isEverySet = setIndex === EVERY_SET;
    const scopeDescription = isEverySet
      ? `every set of ${exercise.name}`
      : `set ${setIndex + 1} of ${exercise.name}`;
    const cellKey = `${isEverySet ? "every" : setIndex}-${field}`;
    const fieldId = `day-${dayNumber}-${exercise.key}-${cellKey}`;

    if (editingKey === cellKey) {
      return (
        <ExerciseValueEditor
          key={cellKey}
          scopeDescription={scopeDescription}
          field={field}
          label={FIELD_LABELS[field]}
          value={resolved.value}
          fallbackNote={
            isEverySet
              ? `Programme default ${resolved.fallback}.`
              : `Every set is ${resolved.fallback}.`
          }
          fieldId={fieldId}
          otherDaysNote={otherDaysNote}
          onCommit={(committed) =>
            onSetValue(setIndex, field, committed, scopeDescription)
          }
          onDone={() => {
            setEditingKey(null);
            setRefocusKey(cellKey);
          }}
        />
      );
    }

    return (
      <div className="flex flex-col items-start">
        <button
          type="button"
          autoFocus={refocusKey === cellKey}
          onClick={() => setEditingKey(cellKey)}
          className={cn(
            "min-h-[44px] rounded px-2 font-medium",
            isEverySet || resolved.isAdjusted
              ? "border border-dashed border-primary hover:bg-primary/5 dark:border-primary-dark"
              : "text-accent-3/70 underline decoration-dotted underline-offset-4 dark:text-accent-1/70"
          )}
        >
          {resolved.value}
          <span className="sr-only">
            {" "}
            — change {field} for {scopeDescription}
          </span>
        </button>
        {resolved.isAdjusted && (
          <button
            type="button"
            onClick={() => onSetValue(setIndex, field, "", scopeDescription)}
            className="min-h-[44px] px-2 text-xs text-accent-3/70 underline underline-offset-2 dark:text-accent-1/70"
          >
            {isEverySet ? "was" : "use"} {resolved.fallback}
            <span className="sr-only">
              {" "}
              — {isEverySet ? "reset" : "clear"} {field} for {scopeDescription}
            </span>
          </button>
        )}
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
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <dt className="text-accent-3/60 dark:text-accent-1/60">Sets</dt>
            <dd className="font-medium">{exercise.sets}</dd>
            <dt className="text-accent-3/60 dark:text-accent-1/60">Rest</dt>
            <dd className="font-medium">{exercise.restLabel}</dd>
          </dl>
          <div className="mt-2">
            <DemoLink href={exercise.demoUrl} exerciseName={exercise.name} />
          </div>
        </div>
        <WorkoutIllustration markup={exercise.illustrationSvg} />
      </div>

      <table className="mt-4 w-full table-fixed text-left text-sm">
        <caption className="sr-only">{exercise.name} sets</caption>
        <thead>
          <tr className="text-accent-3/60 dark:text-accent-1/60">
            <th scope="col" className="w-[4.5rem] pb-2 font-medium">
              Set
            </th>
            <th scope="col" className="w-[3.25rem] pb-2 font-medium">
              Done
            </th>
            <th scope="col" className="w-[6.5rem] pb-2 font-medium">
              Reps
            </th>
            <th scope="col" className="pb-2 font-medium">
              Weight
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-primary/10">
            <th scope="row" colSpan={2} className="py-2 font-medium">
              Every set
            </th>
            <td className="py-2">
              {renderValue(EVERY_SET, "reps", prescription.reps)}
            </td>
            <td className="py-2">
              {renderValue(EVERY_SET, "weight", prescription.weight)}
            </td>
          </tr>

          {setPrescriptions.map((setPrescription, setIndex) => (
            <tr key={setIndex} className="border-t border-primary/10">
              <th scope="row" className="py-2 font-medium">
                Set {setIndex + 1}
              </th>
              <td className="py-2">
                <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#1E40AF]"
                    checked={completedSets.includes(setIndex)}
                    onChange={() => onToggleSet(setIndex)}
                    aria-label={`${exercise.name} set ${setIndex + 1}`}
                  />
                </label>
              </td>
              <td className="py-2">
                {renderValue(setIndex, "reps", setPrescription.reps)}
              </td>
              <td className="py-2">
                {renderValue(setIndex, "weight", setPrescription.weight)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={onStartRest}
        className="mt-3 rounded border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/10 dark:text-primary-dark"
      >
        Rest {exercise.restLabel}
        <span className="sr-only"> after {exercise.name}</span>
      </button>
    </article>
  );
}
