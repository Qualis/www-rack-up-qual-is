import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Program } from "@/interfaces/program";
import { WorkoutOverview } from "./workout-overview";

const program: Program = {
  title: "Home Strength Program",
  split: "Push / Pull / Legs",
  units: "kg",
  notes: {
    rest: "~2–3 min on heavy lifts.",
    shoulderAndBack: "Keep pressing pain-free.",
  },
  schedule: [
    { day: "Monday", session: "Day 1 — Push", type: "train" },
    { day: "Tuesday", session: "Rest", type: "rest" },
  ],
  days: [],
};

describe("WorkoutOverview", () => {
  it("should list every day of the weekly schedule", () => {
    render(<WorkoutOverview program={program} />);

    expect(
      screen.getByRole("rowheader", { name: "Monday" })
    ).toBeInTheDocument();
  });

  it("should show which session falls on each day", () => {
    render(<WorkoutOverview program={program} />);

    expect(screen.getByText("Day 1 — Push")).toBeInTheDocument();
  });

  it("should mute rest days so the training days stand out", () => {
    render(<WorkoutOverview program={program} />);

    expect(screen.getByText("Rest")).toHaveClass("text-accent-3/60");
  });

  it("should surface every programme note", () => {
    render(<WorkoutOverview program={program} />);

    expect(screen.getByText("~2–3 min on heavy lifts.")).toBeInTheDocument();
  });

  it("should render a camel case note topic as readable words", () => {
    render(<WorkoutOverview program={program} />);

    expect(screen.getByText("shoulder and back")).toBeInTheDocument();
  });
});
