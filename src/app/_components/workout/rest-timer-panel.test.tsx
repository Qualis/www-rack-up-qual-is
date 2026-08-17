import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { RestTimer } from "@/interfaces/workout";
import { RestTimerPanel } from "./rest-timer-panel";

const startEpoch = 1_800_000_000_000;

const timer: RestTimer = {
  dayNumber: 1,
  exerciseKey: "bench",
  exerciseName: "Barbell Bench Press",
  durationSeconds: 180,
  endsAt: startEpoch + 180_000,
};

const renderPanel = (
  overrides: Partial<Parameters<typeof RestTimerPanel>[0]> = {}
) =>
  render(
    <RestTimerPanel
      timer={timer}
      onExpire={vi.fn()}
      onSkip={vi.fn()}
      onRestart={vi.fn()}
      {...overrides}
    />
  );

describe("RestTimerPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(startEpoch);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show the full rest duration when the timer starts", () => {
    renderPanel();

    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("should name the exercise being rested from", () => {
    renderPanel();

    expect(
      screen.getByText("Resting after Barbell Bench Press")
    ).toBeInTheDocument();
  });

  it("should count down as time passes", () => {
    renderPanel();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("should show the correct time after the tab was throttled and no tick fired", () => {
    renderPanel();

    act(() => {
      vi.setSystemTime(startEpoch + 150_000);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByText("0:30")).toBeInTheDocument();
  });

  it("should resynchronise when the page is restored from the back-forward cache", () => {
    renderPanel();

    act(() => {
      vi.setSystemTime(startEpoch + 120_000);
      window.dispatchEvent(new Event("pageshow"));
    });

    expect(screen.getByText("1:00")).toBeInTheDocument();
  });

  it("should resynchronise when the window regains focus", () => {
    renderPanel();

    act(() => {
      vi.setSystemTime(startEpoch + 90_000);
      window.dispatchEvent(new Event("focus"));
    });

    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("should report expiry when the rest is over", () => {
    const onExpire = vi.fn();
    renderPanel({ onExpire });

    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should report expiry only once", () => {
    const onExpire = vi.fn();
    renderPanel({ onExpire });

    act(() => {
      vi.advanceTimersByTime(180_000);
      window.dispatchEvent(new Event("focus"));
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("should skip the rest on request", () => {
    const onSkip = vi.fn();
    renderPanel({ onSkip });

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("should restart the rest on request", () => {
    const onRestart = vi.fn();
    renderPanel({ onRestart });

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("should hide the ticking digits from screen readers to avoid announcing every second", () => {
    renderPanel();

    expect(screen.getByText("3:00")).toHaveAttribute("aria-hidden", "true");
  });

  it("should not carry its own live region, which would be announced unreliably", () => {
    renderPanel();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should stop counting down once it is removed from the page", () => {
    const onExpire = vi.fn();
    const { unmount } = renderPanel({ onExpire });

    unmount();
    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(onExpire).not.toHaveBeenCalled();
  });
});
