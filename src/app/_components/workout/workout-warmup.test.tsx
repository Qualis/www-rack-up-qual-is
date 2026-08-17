import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WarmUp } from "@/interfaces/program";
import { WorkoutWarmUp } from "./workout-warmup";

const warmup: WarmUp = {
  guidance: "Do these in order, then ramp up your first heavy lift.",
  exercises: [
    {
      key: "highknees",
      name: "High Knees",
      cue: "Jog on the spot, drive knees up",
      sets: "—",
      reps: "2–3 min",
      demoUrl: "https://musclewiki.com/exercise/cardio-knee-taps",
      illustrationSvg: "<svg></svg>",
    },
    {
      key: "bandpull",
      name: "Band Pull-Apart",
      cue: "Arms straight, pull to chest",
      sets: "2",
      reps: "15",
      demoUrl: "https://musclewiki.com/exercise/band-pull-apart",
      illustrationSvg: "<svg></svg>",
    },
  ],
};

describe("WorkoutWarmUp", () => {
  it("should show the warm-up guidance for the day", () => {
    render(<WorkoutWarmUp warmup={warmup} />);

    expect(
      screen.getByText("Do these in order, then ramp up your first heavy lift.")
    ).toBeInTheDocument();
  });

  it("should list every warm-up exercise", () => {
    render(<WorkoutWarmUp warmup={warmup} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("should show the prescribed sets and reps for a warm-up exercise", () => {
    render(<WorkoutWarmUp warmup={warmup} />);

    expect(screen.getByText("2 × 15")).toBeInTheDocument();
  });

  it("should offer no set checkboxes because warm-ups are not tracked", () => {
    render(<WorkoutWarmUp warmup={warmup} />);

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("should link each warm-up exercise to its demo", () => {
    render(<WorkoutWarmUp warmup={warmup} />);

    expect(screen.getByRole("link", { name: /High Knees/ })).toHaveAttribute(
      "href",
      "https://musclewiki.com/exercise/cardio-knee-taps"
    );
  });
});
