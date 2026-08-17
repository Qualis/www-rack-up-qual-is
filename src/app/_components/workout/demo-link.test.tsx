import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemoLink } from "./demo-link";

describe("DemoLink", () => {
  it("should link out to the demo for the exercise", () => {
    render(
      <DemoLink
        href="https://musclewiki.com/exercise/barbell-bench-press"
        exerciseName="Barbell Bench Press"
      />
    );

    expect(
      screen.getByRole("link", { name: /Barbell Bench Press/ })
    ).toHaveAttribute(
      "href",
      "https://musclewiki.com/exercise/barbell-bench-press"
    );
  });

  it("should open the demo in a new tab so the workout is not navigated away from", () => {
    render(<DemoLink href="https://example.com" exerciseName="Plank" />);

    expect(screen.getByRole("link", { name: /Plank/ })).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  it("should not expose the opener to the external site", () => {
    render(<DemoLink href="https://example.com" exerciseName="Plank" />);

    expect(screen.getByRole("link", { name: /Plank/ })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });
});
