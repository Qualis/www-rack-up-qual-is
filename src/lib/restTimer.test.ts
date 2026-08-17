import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CountdownSnapshot,
  DeadlineCountdown,
  deadlineFromNow,
  elapsedFractionOf,
  formatCountdown,
  remainingMillisecondsUntil,
} from "./restTimer";

describe("remainingMillisecondsUntil", () => {
  it("should return the gap to the deadline when the deadline is in the future", () => {
    expect(remainingMillisecondsUntil(10_000, 4_000)).toBe(6_000);
  });

  it("should clamp to zero when the deadline has already passed", () => {
    expect(remainingMillisecondsUntil(10_000, 25_000)).toBe(0);
  });
});

describe("deadlineFromNow", () => {
  it("should place the deadline the rest duration ahead of the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_800_000_000_000);

    expect(deadlineFromNow(180)).toBe(1_800_000_180_000);

    vi.useRealTimers();
  });
});

describe("formatCountdown", () => {
  it("should format three minutes of rest as minutes and padded seconds", () => {
    expect(formatCountdown(180_000)).toBe("3:00");
  });

  it("should pad seconds below ten", () => {
    expect(formatCountdown(65_000)).toBe("1:05");
  });

  it("should round a partial second up so the countdown never shows zero early", () => {
    expect(formatCountdown(500)).toBe("0:01");
  });

  it("should show zero when no time remains", () => {
    expect(formatCountdown(0)).toBe("0:00");
  });
});

describe("elapsedFractionOf", () => {
  it("should report no progress when the timer has just started", () => {
    expect(elapsedFractionOf(60, 60_000)).toBe(0);
  });

  it("should report half progress at the midpoint", () => {
    expect(elapsedFractionOf(60, 30_000)).toBe(0.5);
  });

  it("should report full progress when no time remains", () => {
    expect(elapsedFractionOf(60, 0)).toBe(1);
  });

  it("should report full progress when the duration is zero", () => {
    expect(elapsedFractionOf(0, 0)).toBe(1);
  });

  it("should clamp to full progress when more time has elapsed than the duration", () => {
    expect(elapsedFractionOf(60, -5_000)).toBe(1);
  });

  it("should clamp to no progress when the remaining time exceeds the duration", () => {
    expect(elapsedFractionOf(60, 90_000)).toBe(0);
  });
});

describe("DeadlineCountdown", () => {
  const startEpoch = 1_800_000_000_000;
  let currentTime: number;
  let updates: CountdownSnapshot[];
  let expiries: number;

  const now = (): number => currentTime;
  const recordUpdate = (snapshot: CountdownSnapshot): void => {
    updates.push(snapshot);
  };
  const recordExpiry = (): void => {
    expiries += 1;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(startEpoch);
    currentTime = startEpoch;
    updates = [];
    expiries = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should report the full duration before any time has elapsed", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 90_000,
      recordUpdate,
      recordExpiry,
      now
    );

    expect(countdown.snapshot().remainingMilliseconds).toBe(90_000);
  });

  it("should report the deadline as not expired while time remains", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 90_000,
      recordUpdate,
      recordExpiry,
      now
    );

    expect(countdown.snapshot().hasExpired).toBe(false);
  });

  it("should emit the current snapshot as soon as it starts", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 90_000,
      recordUpdate,
      recordExpiry,
      now
    );

    countdown.start();

    expect(updates).toHaveLength(1);
  });

  it("should derive the remaining time from the clock rather than counting ticks", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 180_000,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();

    currentTime = startEpoch + 120_000;
    countdown.resync();

    expect(updates.at(-1)?.remainingMilliseconds).toBe(60_000);
  });

  it("should still report the correct remaining time when no tick fired while the tab was hidden", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 180_000,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();

    currentTime = startEpoch + 175_000;

    expect(countdown.snapshot().remainingMilliseconds).toBe(5_000);
  });

  it("should schedule the next emission on the next whole second boundary", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 90_500,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();

    currentTime = startEpoch + 500;
    vi.advanceTimersByTime(500);

    expect(updates.at(-1)?.remainingMilliseconds).toBe(90_000);
  });

  it("should schedule a full second ahead when the remaining time is already on a second boundary", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 2_000,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();

    currentTime = startEpoch + 999;
    vi.advanceTimersByTime(999);

    expect(updates).toHaveLength(1);
  });

  it("should notify expiry once the deadline is reached", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 1_000,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();

    currentTime = startEpoch + 1_000;
    vi.advanceTimersByTime(1_000);

    expect(expiries).toBe(1);
  });

  it("should notify expiry only once even when resynced after the deadline", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 1_000,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();
    currentTime = startEpoch + 1_000;
    vi.advanceTimersByTime(1_000);

    countdown.resync();

    expect(expiries).toBe(1);
  });

  it("should stop emitting once it has been stopped", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 90_000,
      recordUpdate,
      recordExpiry,
      now
    );
    countdown.start();

    countdown.stop();
    currentTime = startEpoch + 5_000;
    vi.advanceTimersByTime(5_000);

    expect(updates).toHaveLength(1);
  });

  it("should tolerate being stopped when it was never started", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 90_000,
      recordUpdate,
      recordExpiry,
      now
    );

    countdown.stop();

    expect(updates).toHaveLength(0);
  });

  it("should read the wall clock when no clock is injected", () => {
    const countdown = new DeadlineCountdown(
      startEpoch + 30_000,
      recordUpdate,
      recordExpiry
    );

    expect(countdown.snapshot().remainingMilliseconds).toBe(30_000);
  });
});
