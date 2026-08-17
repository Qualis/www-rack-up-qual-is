import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseValueEditor } from "./exercise-value-editor";

const renderEditor = (
  overrides: Partial<Parameters<typeof ExerciseValueEditor>[0]> = {}
) =>
  render(
    <ExerciseValueEditor
      scopeDescription="every set of Barbell Bench Press"
      field="weight"
      label="Weight"
      value="40 kg"
      fallbackNote="Programme default 40 kg."
      fieldId="day-1-bench-weight"
      otherDaysNote=""
      onCommit={vi.fn()}
      onDone={vi.fn()}
      {...overrides}
    />
  );

const weightField = () =>
  screen.getByLabelText(/Weight for every set of Barbell Bench Press/);

describe("ExerciseValueEditor", () => {
  it("should commit the typed value when the field loses focus without being submitted", async () => {
    const onCommit = vi.fn();
    renderEditor({ onCommit });

    await userEvent.clear(weightField());
    await userEvent.type(weightField(), "45 kg");
    fireEvent.blur(weightField());

    expect(onCommit).toHaveBeenLastCalledWith("45 kg");
  });

  it("should not close the editor when the field merely loses focus", async () => {
    const onDone = vi.fn();
    renderEditor({ onDone });

    fireEvent.blur(weightField());

    expect(onDone).not.toHaveBeenCalled();
  });

  it("should commit the typed value when the form is submitted", async () => {
    const onCommit = vi.fn();
    renderEditor({ onCommit });

    await userEvent.clear(weightField());
    await userEvent.type(weightField(), "45 kg{Enter}");

    expect(onCommit).toHaveBeenLastCalledWith("45 kg");
  });

  it("should close the editor when the form is submitted", async () => {
    const onDone = vi.fn();
    renderEditor({ onDone });

    await userEvent.click(screen.getByRole("button", { name: /^Done/ }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("should take focus when it opens, so it is never left on the document", () => {
    renderEditor();

    expect(screen.getByRole("group")).toHaveFocus();
  });

  it("should adopt the stored value when it changes underneath an open editor", () => {
    const { rerender } = renderEditor();

    rerender(
      <ExerciseValueEditor
        scopeDescription="every set of Barbell Bench Press"
        field="weight"
        label="Weight"
        value="60 kg"
        fallbackNote="Programme default 40 kg."
        fieldId="day-1-bench-weight"
        otherDaysNote=""
        onCommit={vi.fn()}
        onDone={vi.fn()}
      />
    );

    expect(weightField()).toHaveValue("60 kg");
  });

  it("should keep the stepper controls in place while a value is being typed", async () => {
    renderEditor();

    await userEvent.clear(weightField());
    await userEvent.type(weightField(), "42.");

    expect(
      screen.getAllByRole("button", { name: /crease weight/ })
    ).toHaveLength(2);
  });

  it("should disable stepping while a partially typed value cannot be stepped", async () => {
    renderEditor();

    await userEvent.clear(weightField());
    await userEvent.type(weightField(), "42.");

    expect(
      screen.getByRole("button", { name: /Increase weight/ })
    ).toBeDisabled();
  });

  it("should commit the lowered value when the decrease control is used", async () => {
    const onCommit = vi.fn();
    renderEditor({ onCommit });

    await userEvent.click(
      screen.getByRole("button", { name: /Decrease weight/ })
    );

    expect(onCommit).toHaveBeenCalledWith("37.5 kg");
  });

  it("should disable stepping down when the reps are already at one", () => {
    renderEditor({ field: "reps", label: "Reps", value: "1" });

    expect(
      screen.getByRole("button", { name: /Decrease reps/ })
    ).toBeDisabled();
  });

  it("should name the exercise on the stepper controls", () => {
    renderEditor();

    expect(
      screen.getByRole("button", {
        name: "Increase weight for every set of Barbell Bench Press",
      })
    ).toBeInTheDocument();
  });

  it("should describe the programme default without dangling punctuation", () => {
    renderEditor();

    expect(screen.getByText(/Programme default/).textContent?.trim()).toBe(
      "Programme default 40 kg."
    );
  });

  it("should name the other days an adjustment reaches", () => {
    renderEditor({ otherDaysNote: "Also applies to Day 4" });

    expect(screen.getByText(/Also applies to Day 4/)).toBeInTheDocument();
  });
});
