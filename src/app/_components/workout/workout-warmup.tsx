import { WarmUp } from "@/interfaces/program";
import { DemoLink } from "./demo-link";
import { WorkoutIllustration } from "./workout-illustration";

type Props = {
  warmup: WarmUp;
};

export function WorkoutWarmUp({ warmup }: Props) {
  return (
    <section
      aria-labelledby="warm-up-heading"
      className="rounded-lg border border-primary/15 bg-accent-2/60 p-4 dark:bg-accent-3/40"
    >
      <h3 id="warm-up-heading" className="text-lg font-bold">
        Warm-up
      </h3>
      <p className="mt-1 text-sm text-accent-3/70 dark:text-accent-1/70">
        {warmup.guidance}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {warmup.exercises.map((exercise) => (
          <li
            key={exercise.key}
            className="flex items-start justify-between gap-3 rounded border border-primary/10 p-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{exercise.name}</p>
              <p className="text-sm text-accent-3/70 dark:text-accent-1/70">
                {exercise.cue}
              </p>
              <p className="mt-1 text-sm font-medium">
                {exercise.sets} × {exercise.reps}
              </p>
              <div className="mt-1">
                <DemoLink
                  href={exercise.demoUrl}
                  exerciseName={exercise.name}
                />
              </div>
            </div>
            <WorkoutIllustration markup={exercise.illustrationSvg} />
          </li>
        ))}
      </ul>
    </section>
  );
}
