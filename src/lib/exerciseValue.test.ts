import { describe, expect, it } from "vitest";
import { canStepValue, STEP_BY_FIELD, stepValue } from "./exerciseValue";

const { step: repsStep, minimum: repsMinimum } = STEP_BY_FIELD.reps;
const { step: weightStep, minimum: weightMinimum } = STEP_BY_FIELD.weight;

describe("canStepValue", () => {
  it("should allow stepping a bare rep count up", () => {
    expect(canStepValue("8", repsStep, repsMinimum)).toBe(true);
  });

  it("should allow stepping a weight with a unit up", () => {
    expect(canStepValue("40 kg", weightStep, weightMinimum)).toBe(true);
  });

  it("should allow stepping a per-hand weight up", () => {
    expect(canStepValue("10 kg ea", weightStep, weightMinimum)).toBe(true);
  });

  it("should allow stepping a decimal weight up", () => {
    expect(canStepValue("4.6 kg ea", weightStep, weightMinimum)).toBe(true);
  });

  it("should refuse to step body weight", () => {
    expect(canStepValue("Body wt", weightStep, weightMinimum)).toBe(false);
  });

  it("should refuse to step a band", () => {
    expect(canStepValue("Band", weightStep, weightMinimum)).toBe(false);
  });

  it("should refuse to step a rep range", () => {
    expect(canStepValue("12–15", repsStep, repsMinimum)).toBe(false);
  });

  it("should refuse to step a per-limb rep count", () => {
    expect(canStepValue("8 / arm", repsStep, repsMinimum)).toBe(false);
  });

  it("should refuse to step a timed hold", () => {
    expect(canStepValue("30–45 s", repsStep, repsMinimum)).toBe(false);
  });

  it("should refuse to step an empty value", () => {
    expect(canStepValue("", weightStep, weightMinimum)).toBe(false);
  });

  it("should refuse to step a single rep down, because zero reps is not a prescription", () => {
    expect(canStepValue("1", -repsStep, repsMinimum)).toBe(false);
  });

  it("should refuse to step a weight below zero", () => {
    expect(canStepValue("2.1 kg", -weightStep, weightMinimum)).toBe(false);
  });
});

describe("stepValue", () => {
  it("should add a rep when stepping a bare rep count up", () => {
    expect(stepValue("8", repsStep, repsMinimum)).toBe("9");
  });

  it("should remove a rep when stepping a bare rep count down", () => {
    expect(stepValue("8", -repsStep, repsMinimum)).toBe("7");
  });

  it("should keep the unit when stepping a weight up", () => {
    expect(stepValue("40 kg", weightStep, weightMinimum)).toBe("42.5 kg");
  });

  it("should keep a multi-word unit when stepping a weight up", () => {
    expect(stepValue("10 kg ea", weightStep, weightMinimum)).toBe("12.5 kg ea");
  });

  it("should keep a decimal weight exact rather than accumulating float error", () => {
    expect(stepValue("4.6 kg ea", weightStep, weightMinimum)).toBe("7.1 kg ea");
  });

  it("should leave a value that has no leading number untouched", () => {
    expect(stepValue("Body wt", weightStep, weightMinimum)).toBe("Body wt");
  });

  it("should leave a rep range untouched", () => {
    expect(stepValue("12–15", repsStep, repsMinimum)).toBe("12–15");
  });

  it("should leave the reps unchanged rather than reaching zero", () => {
    expect(stepValue("1", -repsStep, repsMinimum)).toBe("1");
  });

  it("should never reach zero reps however many times it is stepped down", () => {
    let reps = "5";
    for (let tap = 0; tap < 7; tap += 1) {
      reps = stepValue(reps, -repsStep, repsMinimum);
    }

    expect(reps).toBe("1");
  });

  it("should leave a weight unchanged rather than passing below zero", () => {
    expect(stepValue("2.1 kg ea", -weightStep, weightMinimum)).toBe(
      "2.1 kg ea"
    );
  });

  it("should return every real rep count to where it started after equal steps down and up", () => {
    const roundTripped = ["5", "6", "8", "10", "12", "15"].map((reps) =>
      stepValue(stepValue(reps, -repsStep, repsMinimum), repsStep, repsMinimum)
    );

    expect(roundTripped).toEqual(["5", "6", "8", "10", "12", "15"]);
  });

  it("should return every real weight to where it started after equal steps down and up", () => {
    const weights = ["40 kg", "20 kg", "10 kg ea", "15 kg ea", "4.6 kg ea"];

    const roundTripped = weights.map((weight) =>
      stepValue(
        stepValue(weight, -weightStep, weightMinimum),
        weightStep,
        weightMinimum
      )
    );

    expect(roundTripped).toEqual(weights);
  });
});
