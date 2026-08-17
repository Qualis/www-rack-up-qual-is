import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProgramDay } from "@/interfaces/program";
import { DayProgress, WorkoutState } from "@/interfaces/workout";
import { EMPTY_WORKOUT_STATE, WORKOUT_STATE_VERSION } from "@/lib/workoutState";
import { WorkoutDay } from "./workout-day";

const pushDay: ProgramDay = {
  day: 1,
  name: "Push",
  focus: "Chest · shoulders · triceps",
  optional: false,
  estimatedMinutes: 50,
  warmup: {
    guidance: "Do these in order.",
    exercises: [
      {
        key: "highknees",
        name: "High Knees",
        cue: "Jog on the spot",
        sets: "—",
        reps: "2–3 min",
        demoUrl: "https://musclewiki.com/exercise/cardio-knee-taps",
        illustrationSvg: "<svg></svg>",
      },
    ],
  },
  exercises: [
    {
      key: "bench",
      name: "Barbell Bench Press",
      cue: "Lower to chest",
      sets: "4",
      reps: "5",
      restSeconds: 180,
      restLabel: "3 min",
      weight: "40 kg",
      demoUrl: "https://musclewiki.com/exercise/barbell-bench-press",
      illustrationSvg: "<svg></svg>",
    },
  ],
};

const progress: DayProgress = {
  dayNumber: 1,
  completedSets: 1,
  totalSets: 4,
  exercises: [
    {
      exerciseKey: "bench",
      name: "Barbell Bench Press",
      completedSets: 1,
      totalSets: 4,
    },
  ],
};

const trainedState: WorkoutState = {
  version: WORKOUT_STATE_VERSION,
  days: {
    "1": { lastActiveDate: "2026-08-16", completedSets: { bench: [0] } },
  },
  exercises: {},
};

const renderDay = (overrides: Partial<Parameters<typeof WorkoutDay>[0]> = {}) =>
  render(
    <WorkoutDay
      day={pushDay}
      progress={progress}
      state={trainedState}
      restingExerciseKey={null}
      onToggleSet={vi.fn()}
      onStartRest={vi.fn()}
      onResetDay={vi.fn()}
      onSetExerciseValue={vi.fn()}
      otherDaysNoteFor={() => ""}
      {...overrides}
    />
  );

describe("WorkoutDay", () => {
  it("should name the day and its focus", () => {
    renderDay();

    expect(
      screen.getByRole("heading", { name: "Day 1 — Push" })
    ).toBeInTheDocument();
  });

  it("should not mark a core day as optional", () => {
    renderDay();

    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  });

  it("should mark an optional day as optional", () => {
    renderDay({ day: { ...pushDay, optional: true } });

    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("should show how many sets are done out of the day total", () => {
    renderDay();

    expect(screen.getByText("1 of 4 sets done")).toBeInTheDocument();
  });

  it("should expose the day progress to assistive technology", () => {
    renderDay();

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1"
    );
  });

  it("should report no progress when the day prescribes no sets", () => {
    renderDay({
      progress: { ...progress, completedSets: 0, totalSets: 0 },
    });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "0"
    );
  });

  it("should show when the day was last trained", () => {
    renderDay();

    expect(screen.getByText("Last trained 2026-08-16")).toBeInTheDocument();
  });

  it("should say nothing about training history for a day never trained", () => {
    renderDay({ state: EMPTY_WORKOUT_STATE });

    expect(screen.queryByText(/Last trained/)).not.toBeInTheDocument();
  });

  it("should render the warm-up block", () => {
    renderDay();

    expect(
      screen.getByRole("heading", { name: "Warm-up" })
    ).toBeInTheDocument();
  });

  it("should render each working exercise", () => {
    renderDay();

    expect(
      screen.getByRole("heading", { name: "Barbell Bench Press" })
    ).toBeInTheDocument();
  });

  it("should show stored completions on the set checkboxes", () => {
    renderDay();

    expect(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    ).toBeChecked();
  });

  it("should report which exercise and set were checked off", async () => {
    const onToggleSet = vi.fn();
    renderDay({ onToggleSet });

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 2" })
    );

    expect(onToggleSet).toHaveBeenCalledWith(pushDay.exercises[0], 1);
  });

  it("should report which exercise a manual rest was started for", async () => {
    const onStartRest = vi.fn();
    renderDay({ onStartRest });

    await userEvent.click(screen.getByRole("button", { name: /Rest 3 min/ }));

    expect(onStartRest).toHaveBeenCalledWith(pushDay.exercises[0]);
  });

  it("should report which exercise and field were adjusted", async () => {
    const onSetExerciseValue = vi.fn();
    renderDay({ onSetExerciseValue });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Increase weight/ })
    );

    expect(onSetExerciseValue).toHaveBeenCalledWith(
      pushDay.exercises[0],
      "weight",
      "42.5 kg"
    );
  });

  it("should show an adjusted weight in place of the programme default", () => {
    renderDay({
      state: {
        ...trainedState,
        exercises: { bench: { reps: null, weight: "42.5 kg" } },
      },
    });

    expect(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    ).toHaveTextContent("42.5 kg");
  });

  it("should highlight the exercise whose rest timer is running", () => {
    const { container } = renderDay({ restingExerciseKey: "bench" });

    expect(container.querySelector("article")).toHaveClass("border-primary");
  });

  it("should ask for confirmation before clearing a day", async () => {
    const onResetDay = vi.fn();
    renderDay({ onResetDay });

    await userEvent.click(screen.getByRole("button", { name: "Reset day" }));

    expect(onResetDay).not.toHaveBeenCalled();
  });

  it("should clear the day once the reset is confirmed", async () => {
    const onResetDay = vi.fn();
    renderDay({ onResetDay });

    await userEvent.click(screen.getByRole("button", { name: "Reset day" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm reset" })
    );

    expect(onResetDay).toHaveBeenCalledTimes(1);
  });

  it("should return to the reset button once the reset is confirmed", async () => {
    renderDay();

    await userEvent.click(screen.getByRole("button", { name: "Reset day" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm reset" })
    );

    expect(
      screen.getByRole("button", { name: "Reset day" })
    ).toBeInTheDocument();
  });

  it("should abandon the reset when it is cancelled", async () => {
    const onResetDay = vi.fn();
    renderDay({ onResetDay });

    await userEvent.click(screen.getByRole("button", { name: "Reset day" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onResetDay).not.toHaveBeenCalled();
  });
});
