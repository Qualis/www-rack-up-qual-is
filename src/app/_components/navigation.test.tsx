import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navigation } from "./navigation";

describe("Navigation", () => {
  it("should render a navigation landmark", () => {
    render(<Navigation />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("should show the RackUp product name", () => {
    render(<Navigation />);

    expect(screen.getByText("RackUp")).toBeInTheDocument();
  });

  it("should link the product name back to the workout", () => {
    render(<Navigation />);

    expect(screen.getByRole("link", { name: /RackUp/ })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("should hide the decorative logo from screen readers", () => {
    const { container } = render(<Navigation />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("should offer the theme switcher", () => {
    render(<Navigation />);

    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
  });

  it("should stay visible while the workout is scrolled", () => {
    render(<Navigation />);

    expect(screen.getByRole("navigation")).toHaveClass("sticky");
  });
});
