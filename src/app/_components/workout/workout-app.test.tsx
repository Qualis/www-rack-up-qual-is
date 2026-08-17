import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Program } from "@/interfaces/program";
import { WorkoutSessionService } from "@/application/services/WorkoutSessionService";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { RestAlert } from "@/lib/restAlert";
import { EMPTY_WORKOUT_STATE } from "@/lib/workoutState";
import { WorkoutApp } from "./workout-app";

const startEpoch = 1_800_000_000_000;

const program: Program = {
  title: "Home Strength Program",
  split: "Push / Pull / Legs",
  units: "kg",
  notes: { rest: "~2–3 min on heavy lifts." },
  schedule: [{ day: "Monday", session: "Day 1 — Push", type: "train" }],
  days: [
    {
      day: 1,
      name: "Push",
      focus: "Chest",
      optional: false,
      estimatedMinutes: 50,
      warmup: { guidance: "Do these in order.", exercises: [] },
      exercises: [
        {
          key: "bench",
          name: "Barbell Bench Press",
          cue: "Lower to chest",
          sets: "2",
          reps: "5",
          restSeconds: 180,
          restLabel: "3 min",
          weight: "40 kg",
          demoUrl: "https://musclewiki.com/exercise/barbell-bench-press",
          illustrationSvg: "<svg></svg>",
        },
        {
          key: "plank",
          name: "Plank",
          cue: "Brace hard",
          sets: "1",
          reps: "30–45 s",
          restSeconds: 45,
          restLabel: "45 s",
          weight: "Body wt",
          demoUrl: "https://musclewiki.com/exercise/forearm-plank",
          illustrationSvg: "<svg></svg>",
        },
      ],
    },
    {
      day: 4,
      name: "Full Body",
      focus: "Optional extra session",
      optional: true,
      estimatedMinutes: 55,
      warmup: { guidance: "Do these in order.", exercises: [] },
      exercises: [
        {
          key: "bench",
          name: "Barbell Bench Press",
          cue: "Sit tall",
          sets: "3",
          reps: "8",
          restSeconds: 120,
          restLabel: "2 min",
          weight: "20 kg",
          demoUrl: "https://musclewiki.com/exercise/dumbbell-goblet-squat",
          illustrationSvg: "<svg></svg>",
        },
      ],
    },
  ],
};

const emptyProgram: Program = { ...program, days: [] };

class UnwritableWorkoutStateRepository extends InMemoryWorkoutStateRepository {
  override hasPersistenceFailed(): boolean {
    return true;
  }
}

describe("WorkoutApp", () => {
  let repository: InMemoryWorkoutStateRepository;
  let sessionService: WorkoutSessionService;
  let restAlert: RestAlert;

  const renderApp = (
    overrides: Partial<Parameters<typeof WorkoutApp>[0]> = {}
  ) =>
    render(
      <WorkoutApp
        program={program}
        sessionService={sessionService}
        restAlert={restAlert}
        {...overrides}
      />
    );

  const checkOffFirstSet = (): void => {
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(startEpoch);
    repository = new InMemoryWorkoutStateRepository();
    sessionService = new WorkoutSessionService(repository);
    restAlert = { prepare: vi.fn(), signal: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show the program title", () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: "Home Strength Program" })
    ).toBeInTheDocument();
  });

  it("should offer a button for every day in the program", () => {
    renderApp();

    expect(
      screen.getByRole("button", { name: /Day 4 — Full Body/ })
    ).toBeInTheDocument();
  });

  it("should open on the first day of the program", () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: "Day 1 — Push" })
    ).toBeInTheDocument();
  });

  it("should switch to another day when its button is pressed", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(
      screen.getByRole("heading", { name: "Day 4 — Full Body" })
    ).toBeInTheDocument();
  });

  it("should render nothing when the program has no days", () => {
    const { container } = renderApp({ program: emptyProgram });

    expect(container).toBeEmptyDOMElement();
  });

  it("should surface the weekly schedule", () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: "Weekly schedule" })
    ).toBeInTheDocument();
  });

  it("should restore previously completed sets on load", () => {
    sessionService.toggleSetCompletion(1, "bench", 1, "2026-08-16");

    renderApp();

    expect(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 2" })
    ).toBeChecked();
  });

  it("should persist a set as soon as it is checked off", () => {
    renderApp();

    checkOffFirstSet();

    expect(repository.load().days["1"]?.completedSets["bench"]).toEqual([0]);
  });

  it("should clear a set when it is unchecked", () => {
    renderApp();

    checkOffFirstSet();
    checkOffFirstSet();

    expect(repository.load().days["1"]?.completedSets["bench"]).toEqual([]);
  });

  it("should update the day progress as sets are checked off", () => {
    renderApp();

    checkOffFirstSet();

    expect(screen.getByText("1 of 3 sets done")).toBeInTheDocument();
  });

  it("should pick up progress written by another tab", () => {
    renderApp();

    act(() => {
      repository.notifyExternalChange(
        sessionService.toggleSetCompletion(1, "bench", 0, "2026-08-16")
      );
    });

    expect(
      screen.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    ).toBeChecked();
  });

  it("should clear the day when a reset is confirmed", () => {
    renderApp();
    checkOffFirstSet();

    fireEvent.click(screen.getByRole("button", { name: "Reset day" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(screen.getByText("0 of 3 sets done")).toBeInTheDocument();
  });

  it("should start the rest timer automatically when a set is checked off", () => {
    renderApp();

    checkOffFirstSet();

    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("should unlock audio inside the gesture that starts the rest", () => {
    renderApp();

    checkOffFirstSet();

    expect(restAlert.prepare).toHaveBeenCalled();
  });

  it("should not start a rest timer when a set is unchecked", () => {
    renderApp();

    checkOffFirstSet();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    checkOffFirstSet();

    expect(screen.queryByLabelText("Rest timer")).not.toBeInTheDocument();
  });

  it("should start the rest timer on request without checking a set off", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: /Rest 3 min/ }));

    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("should count the rest down from the exercise rest duration", () => {
    renderApp();
    checkOffFirstSet();

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(screen.getByText("1:00")).toBeInTheDocument();
  });

  it("should play the finish sound when the rest reaches zero", () => {
    renderApp();
    checkOffFirstSet();

    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(restAlert.signal).toHaveBeenCalledTimes(1);
  });

  it("should clear the rest timer when it reaches zero, with nothing to dismiss", () => {
    renderApp();
    checkOffFirstSet();

    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(screen.queryByLabelText("Rest timer")).not.toBeInTheDocument();
  });

  it("should announce that the rest is complete", () => {
    renderApp();
    checkOffFirstSet();

    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(
      screen.getByRole("status", { name: "Rest timer updates" })
    ).toHaveTextContent("Rest complete — next set");
  });

  it("should let the completion notice fade on its own without any interaction", () => {
    renderApp();
    checkOffFirstSet();

    act(() => {
      vi.advanceTimersByTime(180_000);
    });
    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    expect(
      screen.queryByText("Rest complete — next set")
    ).not.toBeInTheDocument();
  });

  it("should stop the rest timer when it is skipped", () => {
    renderApp();
    checkOffFirstSet();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.queryByLabelText("Rest timer")).not.toBeInTheDocument();
  });

  it("should restart the rest from the full duration on request", () => {
    renderApp();
    checkOffFirstSet();
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));

    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("should clear the completion notice when a new rest starts", () => {
    renderApp();
    checkOffFirstSet();
    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    fireEvent.click(screen.getByRole("button", { name: /Rest 3 min/ }));

    expect(
      screen.queryByText("Rest complete — next set")
    ).not.toBeInTheDocument();
  });

  it("should keep the rest running when another day is browsed", () => {
    renderApp();
    checkOffFirstSet();

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(screen.getByLabelText("Rest timer")).toBeInTheDocument();
  });

  it("should keep counting down the original rest duration while another day is browsed", () => {
    renderApp();
    checkOffFirstSet();

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("should not highlight an exercise on another day that shares the resting exercise key", () => {
    const { container } = renderApp();
    checkOffFirstSet();

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(container.querySelector("article")).not.toHaveClass(
      "border-primary"
    );
  });

  it("should ring only once for a rest that finishes while another day is browsed", () => {
    renderApp();
    checkOffFirstSet();

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));
    act(() => {
      vi.advanceTimersByTime(600_000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Day 1 — Push/ }));

    expect(restAlert.signal).toHaveBeenCalledTimes(1);
  });

  it("should not re-arm a reset confirmation against a different day", () => {
    sessionService.toggleSetCompletion(4, "bench", 0, "2026-08-16");
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Reset day" }));
    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(
      screen.queryByRole("button", { name: "Confirm reset" })
    ).not.toBeInTheDocument();
  });

  it("should leave a day untouched when a reset armed on another day is abandoned", () => {
    sessionService.toggleSetCompletion(4, "bench", 0, "2026-08-16");
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Reset day" }));
    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(repository.load().days["4"]?.completedSets["bench"]).toEqual([0]);
  });

  it("should keep the completion announcement region present before anything happens", () => {
    renderApp();

    expect(
      screen.getByRole("status", { name: "Rest timer updates" })
    ).toBeEmptyDOMElement();
  });

  it("should announce the running rest through the same live region", () => {
    renderApp();

    checkOffFirstSet();

    expect(
      screen.getByRole("status", { name: "Rest timer updates" })
    ).toHaveTextContent("Resting 180 seconds after Barbell Bench Press");
  });

  it("should keep the storage warning region present while storage is working", () => {
    renderApp();

    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("should warn when progress could not be saved", () => {
    renderApp({
      sessionService: new WorkoutSessionService(
        new UnwritableWorkoutStateRepository()
      ),
    });

    checkOffFirstSet();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Progress cannot be saved in this browser"
    );
  });

  it("should still clear a finished rest when the alert throws", () => {
    renderApp({
      restAlert: {
        prepare: vi.fn(),
        signal: vi.fn(() => {
          throw new Error("AudioContext is closed");
        }),
      },
    });
    checkOffFirstSet();

    act(() => {
      vi.advanceTimersByTime(180_000);
    });

    expect(screen.queryByLabelText("Rest timer")).not.toBeInTheDocument();
  });

  it("should record an adjusted weight through the session service", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    expect(repository.load().exercises["bench"]?.weight).toBe("42.5 kg");
  });

  it("should show an adjusted weight after it is recorded", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done/ }));

    expect(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveTextContent("42.5 kg");
  });

  it("should record an adjusted rep count through the session service", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change reps for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase reps/ }));

    expect(repository.load().exercises["bench"]?.reps).toBe("6");
  });

  it("should warn that an adjustment reaches the other day sharing the exercise", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );

    expect(screen.getByText(/Also applies to Day 4/)).toBeInTheDocument();
  });

  it("should say nothing about other days for an exercise that appears once", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Plank/,
      })
    );

    expect(screen.queryByText(/Also applies to/)).not.toBeInTheDocument();
  });

  it("should carry an adjustment across to the other day sharing the exercise", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveTextContent("42.5 kg");
  });

  it("should keep an adjusted weight when the day is reset", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    fireEvent.click(screen.getByRole("button", { name: "Reset day" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(repository.load().exercises["bench"]?.weight).toBe("42.5 kg");
  });

  it("should keep an adjusted weight when a set is checked off", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    checkOffFirstSet();

    expect(repository.load().exercises["bench"]?.weight).toBe("42.5 kg");
  });

  it("should announce an adjusted weight to a screen reader", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    expect(
      screen.getByRole("status", { name: "Exercise adjustments" })
    ).toHaveTextContent(
      "weight for every set of Barbell Bench Press is now 42.5 kg"
    );
  });

  it("should announce the restored value when an adjustment is reset", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done/ }));

    fireEvent.click(screen.getByRole("button", { name: /reset weight/i }));

    expect(
      screen.getByRole("status", { name: "Exercise adjustments" })
    ).toHaveTextContent(
      "weight for every set of Barbell Bench Press is now 40 kg"
    );
  });

  it("should announce an adjusted rep count to a screen reader", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change reps for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase reps/ }));

    expect(
      screen.getByRole("status", { name: "Exercise adjustments" })
    ).toHaveTextContent("reps for every set of Barbell Bench Press is now 6");
  });

  it("should keep the adjustment announcement region present before anything happens", () => {
    renderApp();

    expect(
      screen.getByRole("status", { name: "Exercise adjustments" })
    ).toBeEmptyDOMElement();
  });

  it("should warn that reps and weight changes are also lost when storage is blocked", () => {
    renderApp({
      sessionService: new WorkoutSessionService(
        new UnwritableWorkoutStateRepository()
      ),
    });

    checkOffFirstSet();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "your sets and any reps or weight changes will be lost"
    );
  });

  it("should record a varied weight for a single set", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    expect(repository.load().exercises["bench"]?.sets["1"]?.weight).toBe(
      "42.5 kg"
    );
  });

  it("should leave the exercise-wide weight alone when a single set is varied", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    expect(repository.load().exercises["bench"]?.weight).toBeNull();
  });

  it("should announce which set was varied to a screen reader", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    expect(
      screen.getByRole("status", { name: "Exercise adjustments" })
    ).toHaveTextContent(
      "weight for set 2 of Barbell Bench Press is now 42.5 kg"
    );
  });

  it("should measure a set variation against the exercise value rather than the programme", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done/ }));

    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));

    expect(repository.load().exercises["bench"]?.sets["1"]?.weight).toBe(
      "45 kg"
    );
  });

  it("should keep a varied set weight when the day is reset", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done/ }));

    fireEvent.click(screen.getByRole("button", { name: "Reset day" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));

    expect(repository.load().exercises["bench"]?.sets["1"]?.weight).toBe(
      "42.5 kg"
    );
  });

  it("should keep a varied set weight when a set is checked off", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done/ }));

    checkOffFirstSet();

    expect(repository.load().exercises["bench"]?.sets["1"]?.weight).toBe(
      "42.5 kg"
    );
  });

  it("should carry a varied set weight across to the other day sharing the exercise", () => {
    renderApp();
    fireEvent.click(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /Increase weight/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done/ }));

    fireEvent.click(screen.getByRole("button", { name: /Day 4 — Full Body/ }));

    expect(
      screen.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    ).toHaveTextContent("42.5 kg");
  });

  it("should start with no stored progress when nothing has been saved", () => {
    renderApp();

    expect(sessionService.loadState()).toBe(EMPTY_WORKOUT_STATE);
  });

  it("should render no completed sets on the server so hydration matches the first client render", () => {
    sessionService.toggleSetCompletion(1, "bench", 0, "2026-08-16");

    const markup = renderToString(
      <WorkoutApp
        program={program}
        sessionService={sessionService}
        restAlert={restAlert}
      />
    );

    expect(markup).not.toContain('checked=""');
  });
});
