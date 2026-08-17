import { Program } from "@/interfaces/program";

export function otherDaysWithExercise(
  program: Program,
  exerciseKey: string,
  dayNumber: number
): number[] {
  return program.days
    .filter(
      (day) =>
        day.day !== dayNumber &&
        day.exercises.some((exercise) => exercise.key === exerciseKey)
    )
    .map((day) => day.day);
}

export function describeOtherDays(dayNumbers: readonly number[]): string {
  return `Also applies to ${dayNumbers.map((dayNumber) => `Day ${dayNumber}`).join(", ")}`;
}
