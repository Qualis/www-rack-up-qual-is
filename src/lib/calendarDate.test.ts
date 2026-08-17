import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayIsoDate, toIsoDate } from "./calendarDate";

describe("toIsoDate", () => {
  it("should format a date as a zero-padded ISO calendar day", () => {
    expect(toIsoDate(new Date(2026, 7, 6))).toBe("2026-08-06");
  });

  it("should use the local calendar day rather than the UTC day", () => {
    expect(toIsoDate(new Date(2026, 0, 1, 23, 59))).toBe("2026-01-01");
  });
});

describe("todayIsoDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 16, 9, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should report the current local calendar day", () => {
    expect(todayIsoDate()).toBe("2026-08-16");
  });
});
