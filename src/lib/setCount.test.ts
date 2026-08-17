import { describe, expect, it } from "vitest";
import { setCountFrom, setIndexesFor } from "./setCount";

describe("setCountFrom", () => {
  it("should return the number of sets when given a plain integer string", () => {
    expect(setCountFrom("4")).toBe(4);
  });

  it("should return zero when given the em-dash placeholder used by timed warm-ups", () => {
    expect(setCountFrom("—")).toBe(0);
  });

  it("should return zero when given an empty string", () => {
    expect(setCountFrom("")).toBe(0);
  });

  it("should return the lower bound when given a hyphenated range", () => {
    expect(setCountFrom("3-4")).toBe(3);
  });

  it("should return zero when given a negative number", () => {
    expect(setCountFrom("-1")).toBe(0);
  });
});

describe("setIndexesFor", () => {
  it("should return a zero-based index for every set", () => {
    expect(setIndexesFor("3")).toEqual([0, 1, 2]);
  });

  it("should return an empty array when the exercise has no countable sets", () => {
    expect(setIndexesFor("—")).toEqual([]);
  });
});
