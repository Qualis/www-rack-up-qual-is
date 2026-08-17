import { ExerciseValueField } from "@/interfaces/workout";

const STEPPABLE_VALUE = /^(\d+\.\d+|\d+)([A-Za-z\s]*)$/;

interface StepBounds {
  readonly step: number;
  readonly minimum: number;
}

export const STEP_BY_FIELD: Readonly<Record<ExerciseValueField, StepBounds>> = {
  reps: { step: 1, minimum: 1 },
  weight: { step: 2.5, minimum: 0 },
};

interface SteppableValue {
  readonly amount: number;
  readonly suffix: string;
}

function steppableValueOf(value: string): SteppableValue | null {
  const match = STEPPABLE_VALUE.exec(value.trim());

  if (match === null) {
    return null;
  }

  const [, amount = "", suffix = ""] = match;

  return { amount: Number.parseFloat(amount), suffix };
}

export function stepValue(
  value: string,
  step: number,
  minimum: number
): string {
  const steppable = steppableValueOf(value);

  if (steppable === null) {
    return value;
  }

  const stepped = Math.round((steppable.amount + step) * 100) / 100;

  if (stepped < minimum) {
    return value;
  }

  return `${stepped}${steppable.suffix}`;
}

export function canStepValue(
  value: string,
  step: number,
  minimum: number
): boolean {
  return stepValue(value, step, minimum) !== value;
}
