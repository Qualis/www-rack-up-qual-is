import { describe, expect, it } from "vitest";
import { Exercise, Program } from "@/interfaces/program";
import { describeOtherDays, otherDaysWithExercise } from "./programExercises";

const exerciseNamed = (key: string): Exercise => ({
  key,
  name: key,
  cue: "",
  sets: "3",
  reps: "8",
  restSeconds: 60,
  restLabel: "60 s",
  weight: "20 kg",
  demoUrl: "",
  illustrationSvg: "",
});

const dayWith = (dayNumber: number, keys: string[]) => ({
  day: dayNumber,
  name: `Day ${dayNumber}`,
  focus: "",
  optional: false,
  estimatedMinutes: 50,
  warmup: { guidance: "", exercises: [] },
  exercises: keys.map(exerciseNamed),
});

const program: Program = {
  title: "",
  split: "",
  units: "kg",
  notes: {},
  schedule: [],
  days: [
    dayWith(1, ["bench", "dbpress"]),
    dayWith(2, ["curl"]),
    dayWith(4, ["dbpress", "curl"]),
  ],
};

describe("otherDaysWithExercise", () => {
  it("should report no other days when the exercise appears once", () => {
    expect(otherDaysWithExercise(program, "bench", 1)).toEqual([]);
  });

  it("should report the other day when the exercise recurs", () => {
    expect(otherDaysWithExercise(program, "dbpress", 1)).toEqual([4]);
  });

  it("should exclude the day being viewed", () => {
    expect(otherDaysWithExercise(program, "curl", 4)).toEqual([2]);
  });

  it("should report every other day when the exercise recurs more than once", () => {
    expect(otherDaysWithExercise(program, "dbpress", 2)).toEqual([1, 4]);
  });
});

describe("describeOtherDays", () => {
  it("should name a single other day", () => {
    expect(describeOtherDays([4])).toBe("Also applies to Day 4");
  });

  it("should name every other day", () => {
    expect(describeOtherDays([1, 4])).toBe("Also applies to Day 1, Day 4");
  });
});
