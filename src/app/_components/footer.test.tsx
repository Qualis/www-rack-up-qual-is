import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./footer";

describe("Footer", () => {
  it("should render a footer landmark", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("should tell the user their progress never leaves the browser", () => {
    render(<Footer />);

    expect(
      screen.getByText(/keeps your progress in this browser only/)
    ).toBeInTheDocument();
  });

  it("should make clear the training guidance is not medical advice", () => {
    render(<Footer />);

    expect(screen.getByText(/not medical advice/)).toBeInTheDocument();
  });
});
