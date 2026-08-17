import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Exercise } from "@/interfaces/program";
import { ExerciseOverride } from "@/interfaces/workout";
import { setIndexesFor } from "@/lib/setCount";
import {
  NO_OVERRIDE,
  prescriptionOf,
  setPrescriptionOf,
  withAdjustedValue,
  withSetOverride,
} from "@/lib/workoutState";
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

type RenderOptions = {
  exercise?: Exercise;
  override?: ExerciseOverride;
  completedSets?: readonly number[];
  isResting?: boolean;
  otherDaysNote?: string;
  onToggleSet?: (setIndex: number) => void;
  onStartRest?: () => void;
  onSetValue?: (
    setIndex: number | null,
    field: "reps" | "weight",
    value: string,
    scopeDescription: string
  ) => void;
};

const renderExercise = (options: RenderOptions = {}) => {
  const exercise = options.exercise ?? bench;
  const override = options.override ?? NO_OVERRIDE;

  return render(
    <WorkoutExercise
      exercise={exercise}
      dayNumber={1}
      prescription={prescriptionOf(exercise, override)}
      setPrescriptions={setIndexesFor(exercise.sets).map((setIndex) =>
        setPrescriptionOf(exercise, override, setIndex)
      )}
      completedSets={options.completedSets ?? []}
      isResting={options.isResting ?? false}
      otherDaysNote={options.otherDaysNote ?? ""}
      onToggleSet={options.onToggleSet ?? vi.fn()}
      onStartRest={options.onStartRest ?? vi.fn()}
      onSetValue={options.onSetValue ?? vi.fn()}
    />
  );
};

const everySetWeight = () =>
  screen.getByRole("button", {
    name: /change weight for every set of Barbell Bench Press/,
  });

const setWeight = (setNumber: number) =>
  screen.getByRole("button", {
    name: new RegExp(
      `change weight for set ${setNumber} of Barbell Bench Press`
    ),
  });

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

  it("should render one row per prescribed set", () => {
    renderExercise();

    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("should render no set rows when the exercise has no countable sets", () => {
    renderExercise({ exercise: { ...bench, sets: "—" } });

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("should label each set row with its number for assistive technology", () => {
    renderExercise();

    expect(
      screen.getByRole("rowheader", { name: "Set 3" })
    ).toBeInTheDocument();
  });

  it("should show a set as checked when it has been completed", () => {
    renderExercise({ completedSets: [1] });

    expect(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 2" })
    ).toBeChecked();
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

  it("should link to the external demo", () => {
    renderExercise();

    expect(
      screen.getByRole("link", { name: /Barbell Bench Press/ })
    ).toHaveAttribute("href", bench.demoUrl);
  });

  it("should show the programme weight for every set when nothing is adjusted", () => {
    renderExercise();

    expect(everySetWeight()).toHaveTextContent("40 kg");
  });

  it("should show the exercise weight on a set that has not been varied", () => {
    renderExercise({
      override: withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
    });

    expect(setWeight(2)).toHaveTextContent("42.5 kg");
  });

  it("should show a set's own weight when that set has been varied", () => {
    renderExercise({
      override: withSetOverride(NO_OVERRIDE, 1, {
        reps: null,
        weight: "45 kg",
      }),
    });

    expect(setWeight(2)).toHaveTextContent("45 kg");
  });

  it("should leave the other sets on the exercise value when one set is varied", () => {
    renderExercise({
      override: withSetOverride(NO_OVERRIDE, 1, {
        reps: null,
        weight: "45 kg",
      }),
    });

    expect(setWeight(1)).toHaveTextContent("40 kg");
  });

  it("should offer no clear control on a set that has not been varied", () => {
    renderExercise({
      override: withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
    });

    expect(
      screen.queryByRole("button", { name: /clear weight for set 2/ })
    ).not.toBeInTheDocument();
  });

  it("should offer what the exercise prescribes as the way back on a varied set", () => {
    renderExercise({
      override: withSetOverride(
        withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
        1,
        { reps: null, weight: "45 kg" }
      ),
    });

    expect(
      screen.getByRole("button", { name: /clear weight for set 2/ })
    ).toHaveTextContent("use 42.5 kg");
  });

  it("should offer the programme value as the way back on the every-set row", () => {
    renderExercise({
      override: withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
    });

    expect(
      screen.getByRole("button", { name: /reset weight for every set/ })
    ).toHaveTextContent("was 40 kg");
  });

  it("should clear a set's variation when its way-back control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({
      onSetValue,
      override: withSetOverride(NO_OVERRIDE, 1, {
        reps: null,
        weight: "45 kg",
      }),
    });

    await userEvent.click(
      screen.getByRole("button", { name: /clear weight for set 2/ })
    );

    expect(onSetValue).toHaveBeenCalledWith(
      1,
      "weight",
      "",
      "set 2 of Barbell Bench Press"
    );
  });

  it("should reset the exercise when the every-set way-back control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({
      onSetValue,
      override: withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
    });

    await userEvent.click(
      screen.getByRole("button", { name: /reset weight for every set/ })
    );

    expect(onSetValue).toHaveBeenCalledWith(
      null,
      "weight",
      "",
      "every set of Barbell Bench Press"
    );
  });

  it("should open an editor scoped to the set that was tapped", async () => {
    renderExercise();

    await userEvent.click(setWeight(2));

    expect(
      screen.getByLabelText(/Weight for set 2 of Barbell Bench Press/)
    ).toHaveValue("40 kg");
  });

  it("should open only the tapped set's editor when several sets are shown", async () => {
    renderExercise();

    await userEvent.click(setWeight(2));

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("should report which set was varied when a set's weight is changed", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(setWeight(2));
    await userEvent.click(
      screen.getByRole("button", { name: /Increase weight/ })
    );

    expect(onSetValue).toHaveBeenCalledWith(
      1,
      "weight",
      "42.5 kg",
      "set 2 of Barbell Bench Press"
    );
  });

  it("should report the exercise scope when the every-set weight is changed", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(everySetWeight());
    await userEvent.click(
      screen.getByRole("button", { name: /Increase weight/ })
    );

    expect(onSetValue).toHaveBeenCalledWith(
      null,
      "weight",
      "42.5 kg",
      "every set of Barbell Bench Press"
    );
  });

  it("should step the reps up by one when the increase control is used", async () => {
    const onSetValue = vi.fn();
    renderExercise({ onSetValue });

    await userEvent.click(
      screen.getByRole("button", {
        name: /change reps for every set of Barbell Bench Press/,
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Increase reps/ })
    );

    expect(onSetValue).toHaveBeenCalledWith(
      null,
      "reps",
      "6",
      "every set of Barbell Bench Press"
    );
  });

  it("should tell the user what a set falls back to inside its editor", async () => {
    renderExercise({
      override: withAdjustedValue(NO_OVERRIDE, "weight", "42.5 kg"),
    });

    await userEvent.click(setWeight(2));

    expect(screen.getByText(/Every set is 42.5 kg/)).toBeInTheDocument();
  });

  it("should show the programme default inside the every-set editor", async () => {
    renderExercise();

    await userEvent.click(everySetWeight());

    expect(screen.getByText(/Programme default 40 kg/)).toBeInTheDocument();
  });

  it("should tell the user which other days an adjustment reaches", async () => {
    renderExercise({ otherDaysNote: "Also applies to Day 4" });

    await userEvent.click(setWeight(2));

    expect(screen.getByText(/Also applies to Day 4/)).toBeInTheDocument();
  });

  it("should return focus to the set value it was opened from when the editor closes", async () => {
    renderExercise();

    await userEvent.click(setWeight(2));
    await userEvent.click(screen.getByRole("button", { name: /^Done/ }));

    expect(setWeight(2)).toHaveFocus();
  });

  it("should give every value control a thumb-sized target", () => {
    renderExercise();

    expect(everySetWeight()).toHaveClass("min-h-[44px]");
  });

  it("should keep the tappable affordance visible in dark mode", () => {
    renderExercise();

    expect(everySetWeight()).toHaveClass("dark:border-primary-dark");
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

  it("should keep the definition list to the values that are not per set", () => {
    const { container } = renderExercise();

    expect(
      Array.from(container.querySelectorAll("dt")).map(
        (term) => term.textContent
      )
    ).toEqual(["Sets", "Rest"]);
  });
});
