"use client";

import { useCallback, useState } from "react";
import { ExerciseValueField } from "@/interfaces/workout";
import { canStepValue, STEP_BY_FIELD, stepValue } from "@/lib/exerciseValue";

type Props = {
  scopeDescription: string;
  field: ExerciseValueField;
  label: string;
  value: string;
  fallbackNote: string;
  fieldId: string;
  otherDaysNote: string;
  onCommit: (value: string) => void;
  onDone: () => void;
};

export function ExerciseValueEditor({
  scopeDescription,
  field,
  label,
  value,
  fallbackNote,
  fieldId,
  otherDaysNote,
  onCommit,
  onDone,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [committedValue, setCommittedValue] = useState(value);
  const { step, minimum } = STEP_BY_FIELD[field];
  const describedById = `${fieldId}-description`;

  const focusOnOpen = useCallback((group: HTMLFieldSetElement | null) => {
    group?.focus();
  }, []);

  if (value !== committedValue) {
    setCommittedValue(value);
    setDraft(value);
  }

  const commit = (next: string): void => {
    setDraft(next);
    onCommit(next);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onCommit(draft);
        onDone();
      }}
    >
      <fieldset
        ref={focusOnOpen}
        tabIndex={-1}
        className="min-w-0 rounded border border-primary/20 p-2 focus:outline-none"
      >
        <legend className="sr-only">
          {label} for {scopeDescription}
        </legend>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canStepValue(draft, -step, minimum)}
            onClick={() => commit(stepValue(draft, -step, minimum))}
            className="min-h-[44px] min-w-[44px] rounded border border-primary/40 text-lg text-primary disabled:opacity-40 dark:text-primary-dark"
          >
            <span aria-hidden="true">−</span>
            <span className="sr-only">
              Decrease {field} for {scopeDescription}
            </span>
          </button>

          <label htmlFor={fieldId} className="sr-only">
            {label} for {scopeDescription}
          </label>
          <input
            id={fieldId}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => onCommit(draft)}
            aria-describedby={describedById}
            className="min-h-[44px] w-28 rounded border border-primary/40 bg-transparent px-2 text-center font-medium"
          />

          <button
            type="button"
            disabled={!canStepValue(draft, step, minimum)}
            onClick={() => commit(stepValue(draft, step, minimum))}
            className="min-h-[44px] min-w-[44px] rounded border border-primary/40 text-lg text-primary disabled:opacity-40 dark:text-primary-dark"
          >
            <span aria-hidden="true">+</span>
            <span className="sr-only">
              Increase {field} for {scopeDescription}
            </span>
          </button>

          <button
            type="submit"
            className="min-h-[44px] rounded bg-primary px-3 text-sm text-accent-1 dark:bg-primary-dark"
          >
            Done
            <span className="sr-only">
              {" "}
              editing {field} for {scopeDescription}
            </span>
          </button>
        </div>

        <p
          id={describedById}
          className="mt-2 text-xs text-accent-3/60 dark:text-accent-1/60"
        >
          {fallbackNote} {otherDaysNote}
        </p>
      </fieldset>
    </form>
  );
}
