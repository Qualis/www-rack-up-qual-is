import { beforeEach, describe, expect, it } from "vitest";
import { Exercise, ProgramDay } from "@/interfaces/program";
import { InMemoryWorkoutStateRepository } from "@/infrastructure/repositories/InMemoryWorkoutStateRepository";
import { EMPTY_WORKOUT_STATE } from "@/lib/workoutState";
import { GetDayProgressUseCase } from "./GetDayProgress";
import { ToggleSetCompletionUseCase } from "./ToggleSetCompletion";

const exerciseNamed = (key: string, sets: string): Exercise => ({
  key,
  name: `${key} exercise`,
  cue: "",
  sets,
  reps: "5",
  restSeconds: 60,
  restLabel: "60 s",
  weight: "40 kg",
  demoUrl: "",
  illustrationSvg: "",
});

const dayWith = (exercises: Exercise[]): ProgramDay => ({
  day: 1,
  name: "Push",
  focus: "",
  optional: false,
  estimatedMinutes: 50,
  warmup: { guidance: "", exercises: [] },
  exercises,
});

describe("GetDayProgressUseCase", () => {
  let stateRepository: InMemoryWorkoutStateRepository;
  let toggleSetCompletion: ToggleSetCompletionUseCase;
  let useCase: GetDayProgressUseCase;
  let pushDay: ProgramDay;

  beforeEach(() => {
    stateRepository = new InMemoryWorkoutStateRepository();
    toggleSetCompletion = new ToggleSetCompletionUseCase(stateRepository);
    useCase = new GetDayProgressUseCase();
    pushDay = dayWith([
      exerciseNamed("bench", "4"),
      exerciseNamed("plank", "3"),
    ]);
  });

  it("should total every set prescribed for the day", () => {
    const progress = useCase.execute(pushDay, EMPTY_WORKOUT_STATE);

    expect(progress.totalSets).toBe(7);
  });

  it("should report no completed sets before anything is checked off", () => {
    const progress = useCase.execute(pushDay, EMPTY_WORKOUT_STATE);

    expect(progress.completedSets).toBe(0);
  });

  it("should count completed sets across all exercises on the day", () => {
    toggleSetCompletion.execute(1, "bench", 0, "2026-08-16");
    toggleSetCompletion.execute(1, "plank", 2, "2026-08-16");

    const progress = useCase.execute(pushDay, stateRepository.load());

    expect(progress.completedSets).toBe(2);
  });

  it("should report progress for each exercise separately", () => {
    toggleSetCompletion.execute(1, "bench", 0, "2026-08-16");

    const progress = useCase.execute(pushDay, stateRepository.load());

    expect(progress.exercises[0]).toEqual({
      exerciseKey: "bench",
      name: "bench exercise",
      completedSets: 1,
      totalSets: 4,
    });
  });

  it("should ignore stored sets beyond the prescribed count when the program is shortened", () => {
    toggleSetCompletion.execute(1, "bench", 3, "2026-08-16");

    const progress = useCase.execute(
      dayWith([exerciseNamed("bench", "2")]),
      stateRepository.load()
    );

    expect(progress.completedSets).toBe(0);
  });

  it("should report an empty day when the day prescribes no exercises", () => {
    const progress = useCase.execute(dayWith([]), EMPTY_WORKOUT_STATE);

    expect(progress.exercises).toEqual([]);
  });

  it("should report the day number it was asked about", () => {
    const progress = useCase.execute(pushDay, EMPTY_WORKOUT_STATE);

    expect(progress.dayNumber).toBe(1);
  });
});
