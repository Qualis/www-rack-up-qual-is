import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutIllustration } from "./workout-illustration";

describe("WorkoutIllustration", () => {
  it("should render the illustration markup inline so it scales with the page", () => {
    render(<WorkoutIllustration markup="<svg><circle /></svg>" />);

    expect(
      screen.getByTestId("workout-illustration").querySelector("svg")
    ).toBeInTheDocument();
  });

  it("should hide the illustration from screen readers because the exercise is named alongside it", () => {
    render(<WorkoutIllustration markup="<svg></svg>" />);

    expect(screen.getByTestId("workout-illustration")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});
