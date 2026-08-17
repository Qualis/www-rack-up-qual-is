"use client";

import { useEffect, useState } from "react";
import { RestTimer } from "@/interfaces/workout";
import {
  DeadlineCountdown,
  elapsedFractionOf,
  formatCountdown,
  remainingMillisecondsUntil,
} from "@/lib/restTimer";

type Props = {
  timer: RestTimer;
  onExpire: () => void;
  onSkip: () => void;
  onRestart: () => void;
};

export function RestTimerPanel({ timer, onExpire, onSkip, onRestart }: Props) {
  const [remainingMilliseconds, setRemainingMilliseconds] = useState(() =>
    remainingMillisecondsUntil(timer.endsAt, Date.now())
  );

  useEffect(() => {
    const countdown = new DeadlineCountdown(
      timer.endsAt,
      (snapshot) => setRemainingMilliseconds(snapshot.remainingMilliseconds),
      onExpire
    );
    countdown.start();

    const resynchronise = (): void => countdown.resync();

    document.addEventListener("visibilitychange", resynchronise);
    window.addEventListener("pageshow", resynchronise);
    window.addEventListener("focus", resynchronise);

    return () => {
      countdown.stop();
      document.removeEventListener("visibilitychange", resynchronise);
      window.removeEventListener("pageshow", resynchronise);
      window.removeEventListener("focus", resynchronise);
    };
  }, [timer.endsAt, onExpire]);

  const elapsedPercentage =
    elapsedFractionOf(timer.durationSeconds, remainingMilliseconds) * 100;

  return (
    <section
      aria-label="Rest timer"
      className="sticky bottom-0 z-40 border-t border-primary/20 bg-accent-2/95 backdrop-blur-sm dark:bg-accent-3/95"
    >
      <div
        role="presentation"
        className="h-1 bg-primary transition-[width] duration-200 dark:bg-primary-dark"
        style={{ width: `${elapsedPercentage}%` }}
      />
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <span
          className="text-4xl font-bold tabular-nums text-primary dark:text-primary-dark"
          aria-hidden="true"
        >
          {formatCountdown(remainingMilliseconds)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-accent-3 dark:text-accent-1">
          Resting after {timer.exerciseName}
        </span>
        <button
          type="button"
          onClick={onRestart}
          className="rounded border border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/10 dark:text-primary-dark"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded bg-primary px-3 py-2 text-sm text-accent-1 hover:opacity-90 dark:bg-primary-dark"
        >
          Skip
        </button>
      </div>
    </section>
  );
}
