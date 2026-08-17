export interface CountdownSnapshot {
  readonly remainingMilliseconds: number;
  readonly hasExpired: boolean;
}

export type CountdownListener = (snapshot: CountdownSnapshot) => void;

export function remainingMillisecondsUntil(
  endsAt: number,
  now: number
): number {
  return Math.max(0, endsAt - now);
}

export function deadlineFromNow(durationSeconds: number): number {
  return Date.now() + durationSeconds * 1000;
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function elapsedFractionOf(
  durationSeconds: number,
  remainingMilliseconds: number
): number {
  const durationMilliseconds = durationSeconds * 1000;

  if (durationMilliseconds <= 0) {
    return 1;
  }

  const elapsed = durationMilliseconds - remainingMilliseconds;

  return Math.min(1, Math.max(0, elapsed / durationMilliseconds));
}

export class DeadlineCountdown {
  private scheduledTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hasNotifiedExpiry = false;

  constructor(
    private readonly endsAt: number,
    private readonly onUpdate: CountdownListener,
    private readonly onExpire: () => void,
    private readonly now: () => number = Date.now
  ) {}

  snapshot(): CountdownSnapshot {
    const remainingMilliseconds = remainingMillisecondsUntil(
      this.endsAt,
      this.now()
    );

    return { remainingMilliseconds, hasExpired: remainingMilliseconds === 0 };
  }

  start(): void {
    this.emitAndReschedule();
  }

  stop(): void {
    if (this.scheduledTimeoutId !== null) {
      clearTimeout(this.scheduledTimeoutId);
      this.scheduledTimeoutId = null;
    }
  }

  resync(): void {
    this.stop();
    this.emitAndReschedule();
  }

  private emitAndReschedule(): void {
    const current = this.snapshot();
    this.onUpdate(current);

    if (current.hasExpired) {
      if (!this.hasNotifiedExpiry) {
        this.hasNotifiedExpiry = true;
        this.onExpire();
      }
      return;
    }

    const millisecondsUntilNextWholeSecond =
      current.remainingMilliseconds % 1000 || 1000;

    this.scheduledTimeoutId = setTimeout(() => {
      this.emitAndReschedule();
    }, millisecondsUntilNextWholeSecond);
  }
}
