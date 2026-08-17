import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Exercise } from "@/interfaces/program";
import { WorkoutExercise } from "./workout-exercise";

const bench: Exercise = {
  key: "bench",
  name: "Barbell Bench Press",
  cue: "Lower to chest, press up & slightly back",
  sets: "4",
  reps: "5",
  restSeconds: 180,
  restLabel: "3 min",
  weight: "40 kg",
  demoUrl: "https://musclewiki.com/exercise/barbell-bench-press",
  illustrationSvg: "<svg></svg>",
};

const renderExercise = (
  overrides: Partial<Parameters<typeof WorkoutExercise>[0]> = {}
) =>
  render(
    <WorkoutExercise
      exercise={bench}
      dayNumber={1}
      prescription={{
        reps: bench.reps,
        weight: bench.weight,
        isRepsAdjusted: false,
        isWeightAdjusted: false,
      }}
      completedSets={[]}
      isResting={false}
      otherDaysNote=""
      onToggleSet={vi.fn()}
      onStartRest={vi.fn()}
      onSetValue={vi.fn()}
      {...overrides}
    />
  );

describe("WorkoutExercise", () => {
  it("should name the exercise", () => {
    renderExercise();

    expect(
      screen.getByRole("heading", { name: "Barbell Bench Press" })
    ).toBeInTheDocument();
  });

  it("should show the coaching cue", () => {
    renderExercise();

    expect(
      screen.getByText("Lower to chest, press up & slightly back")
    ).toBeInTheDocument();
  });

  it("should show the prescribed set count", () => {
    renderExercise();

    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("should show the prescribed reps", () => {
    renderExercise();

    expect(
      screen.getByRole("button", {
        name: /change reps for Barbell Bench Press/,
      })
    ).toHaveTextContent("5");
  });

  it("should show the prescribed weight", () => {
    renderExercise();

    expect(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    ).toHaveTextContent("40 kg");
  });

  it("should render one checkbox per prescribed set", () => {
    renderExercise();

    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("should render no checkboxes when the exercise has no countable sets", () => {
    renderExercise({ exercise: { ...bench, sets: "—" } });

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("should show a set as checked when it has been completed", () => {
    renderExercise({ completedSets: [1] });

    expect(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 2" })
    ).toBeChecked();
  });

  it("should show a set as unchecked when it has not been completed", () => {
    renderExercise({ completedSets: [1] });

    expect(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    ).not.toBeChecked();
  });

  it("should report which set was checked off", async () => {
    const onToggleSet = vi.fn();
    renderExercise({ onToggleSet });

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 3" })
    );

    expect(onToggleSet).toHaveBeenCalledWith(2);
  });

  it("should start the rest timer on request", async () => {
    const onStartRest = vi.fn();
    renderExercise({ onStartRest });

    await userEvent.click(screen.getByRole("button", { name: /Rest 3 min/ }));

    expect(onStartRest).toHaveBeenCalledTimes(1);
  });

  it("should highlight the exercise while its rest timer is running", () => {
    const { container } = renderExercise({ isResting: true });

    expect(container.querySelector("article")).toHaveClass("border-primary");
  });

  it("should not highlight the exercise when no rest timer is running for it", () => {
    const { container } = renderExercise({ isResting: false });

    expect(container.querySelector("article")).not.toHaveClass(
      "border-primary"
    );
  });

  it("should link to the external demo", () => {
    renderExercise();

    expect(
      screen.getByRole("link", { name: /Barbell Bench Press/ })
    ).toHaveAttribute("href", bench.demoUrl);
  });

  it("should offer no reset control while the value matches the programme", () => {
    renderExercise();

    expect(
      screen.queryByRole("button", { name: /reset weight/i })
    ).not.toBeInTheDocument();
  });

  it("should show the adjusted weight when one has been recorded", () => {
    renderExercise({
      prescription: {
        reps: "5",
        weight: "42.5 kg",
        isRepsAdjusted: false,
        isWeightAdjusted: true,
      },
    });

    expect(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    ).toHaveTextContent("42.5 kg");
  });

  it("should show what the programme prescribed when a weight has been adjusted", () => {
    renderExercise({
      prescription: {
        reps: "5",
        weight: "42.5 kg",
        isRepsAdjusted: false,
        isWeightAdjusted: true,
      },
    });

    expect(
      screen.getByRole("button", { name: /reset weight/i })
    ).toHaveTextContent("was 40 kg");
  });

  it("should restore the programme default when the reset control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({
      onSetValue,
      prescription: {
        reps: "5",
        weight: "42.5 kg",
        isRepsAdjusted: false,
        isWeightAdjusted: true,
      },
    });

    await userEvent.click(
      screen.getByRole("button", { name: /reset weight/i })
    );

    expect(onSetValue).toHaveBeenCalledWith("weight", "");
  });

  it("should open an editor when the weight is tapped", async () => {
    renderExercise();

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(screen.getByLabelText(/Weight for Barbell Bench Press/)).toHaveValue(
      "40 kg"
    );
  });

  it("should open an editor seeded with the adjusted value", async () => {
    renderExercise({
      prescription: {
        reps: "5",
        weight: "42.5 kg",
        isRepsAdjusted: false,
        isWeightAdjusted: true,
      },
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(screen.getByLabelText(/Weight for Barbell Bench Press/)).toHaveValue(
      "42.5 kg"
    );
  });

  it("should submit the typed weight when the editor is finished", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );
    await userEvent.clear(
      screen.getByLabelText(/Weight for Barbell Bench Press/)
    );
    await userEvent.type(
      screen.getByLabelText(/Weight for Barbell Bench Press/),
      "45 kg"
    );
    await userEvent.click(screen.getByRole("button", { name: /^Done/ }));

    expect(onSetValue).toHaveBeenLastCalledWith("weight", "45 kg");
  });

  it("should close the editor once it is finished", async () => {
    renderExercise();

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );
    await userEvent.click(screen.getByRole("button", { name: /^Done/ }));

    expect(screen.queryByLabelText("weight")).not.toBeInTheDocument();
  });

  it("should step the weight up by a plate when the increase control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Increase weight/ })
    );

    expect(onSetValue).toHaveBeenCalledWith("weight", "42.5 kg");
  });

  it("should step the reps up by one when the increase control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change reps for Barbell Bench Press/,
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Increase reps/ })
    );

    expect(onSetValue).toHaveBeenCalledWith("reps", "6");
  });

  it("should step the weight down when the decrease control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Decrease weight/ })
    );

    expect(onSetValue).toHaveBeenCalledWith("weight", "37.5 kg");
  });

  it("should disable the steppers when the weight has no leading number", async () => {
    renderExercise({
      exercise: { ...bench, weight: "Body wt" },
      prescription: {
        reps: "5",
        weight: "Body wt",
        isRepsAdjusted: false,
        isWeightAdjusted: false,
      },
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(
      screen.getByRole("button", { name: /Increase weight/ })
    ).toBeDisabled();
  });

  it("should tell the user which other days an adjustment reaches", async () => {
    renderExercise({ otherDaysNote: "Also applies to Day 4" });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(screen.getByText(/Also applies to Day 4/)).toBeInTheDocument();
  });

  it("should show the programme default inside the editor", async () => {
    renderExercise();

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(screen.getByText(/Programme default 40 kg/)).toBeInTheDocument();
  });

  it("should keep the definition list free of elements it may not contain while editing", async () => {
    const { container } = renderExercise();

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(
      Array.from(container.querySelector("dl")?.children ?? []).map(
        (child) => child.tagName
      )
    ).toEqual(["DIV", "DIV", "DIV", "DIV"]);
  });

  it("should keep every value labelled by its term while one is being edited", async () => {
    const { container } = renderExercise();

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );

    expect(
      Array.from(container.querySelectorAll("dt")).map(
        (term) => term.textContent
      )
    ).toEqual(["Sets", "Reps", "Weight", "Rest"]);
  });

  it("should return focus to the value it was opened from when the editor closes", async () => {
    renderExercise();

    await userEvent.click(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    );
    await userEvent.click(screen.getByRole("button", { name: /^Done/ }));

    expect(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    ).toHaveFocus();
  });

  it("should give the value control a thumb-sized target", () => {
    renderExercise();

    expect(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    ).toHaveClass("min-h-[44px]");
  });

  it("should give the reset control a thumb-sized target, since it destroys an adjustment", () => {
    renderExercise({
      prescription: {
        reps: "5",
        weight: "42.5 kg",
        isRepsAdjusted: false,
        isWeightAdjusted: true,
      },
    });

    expect(screen.getByRole("button", { name: /reset weight/i })).toHaveClass(
      "min-h-[44px]"
    );
  });

  it("should keep the tappable affordance visible in dark mode", () => {
    renderExercise();

    expect(
      screen.getByRole("button", {
        name: /change weight for Barbell Bench Press/,
      })
    ).toHaveClass("dark:border-primary-dark");
  });

  it("should start the reset control's accessible name with its visible text", () => {
    renderExercise({
      prescription: {
        reps: "5",
        weight: "42.5 kg",
        isRepsAdjusted: false,
        isWeightAdjusted: true,
      },
    });

    expect(
      screen.getByRole("button", { name: /reset weight/i }).textContent
    ).toMatch(/^was 40 kg/);
  });
});
