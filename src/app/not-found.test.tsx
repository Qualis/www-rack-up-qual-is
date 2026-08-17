import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound, { metadata } from "./not-found";

describe("NotFound", () => {
  it("should render the 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("should render the error message", () => {
    render(<NotFound />);
    expect(
      screen.getByText("This page could not be found.")
    ).toBeInTheDocument();
  });

  it("should render a link back to the workout", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: "Back to the workout" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("should export metadata with the correct title", () => {
    expect(metadata.title).toBe("Page not found");
  });
});
