type AudioContextConstructor = new (
  options?: AudioContextOptions
) => AudioContext;

interface AudioCapableWindow {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
}

const SILENT_GAIN = 0.0001;
const PEAK_GAIN = 0.18;
const SCHEDULING_LEAD_SECONDS = 0.02;
const TONE_DURATION_SECONDS = 0.15;
const TONE_GAP_SECONDS = 0.05;
const ATTACK_SECONDS = 0.012;
const RELEASE_SECONDS = 0.035;
const FIRST_TONE_HERTZ = 880;
const SECOND_TONE_HERTZ = 1318.51;
const VIBRATION_PATTERN = [200, 100, 200];

export interface RestAlert {
  prepare(): void;
  signal(): void;
}

export function resolveAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const scope = window as unknown as AudioCapableWindow;

  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

export function scheduleTone(
  context: AudioContext,
  frequencyHertz: number,
  startTime: number
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const endTime = startTime + TONE_DURATION_SECONDS;
  const attackEnd = startTime + ATTACK_SECONDS;
  const releaseStart = Math.max(attackEnd, endTime - RELEASE_SECONDS);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequencyHertz, startTime);

  envelope.gain.setValueAtTime(SILENT_GAIN, startTime);
  envelope.gain.exponentialRampToValueAtTime(PEAK_GAIN, attackEnd);
  envelope.gain.setValueAtTime(PEAK_GAIN, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(SILENT_GAIN, endTime);
  envelope.gain.setValueAtTime(0, endTime);

  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

export function playCompletionBeep(context: AudioContext): void {
  const firstToneStart = context.currentTime + SCHEDULING_LEAD_SECONDS;

  scheduleTone(context, FIRST_TONE_HERTZ, firstToneStart);
  scheduleTone(
    context,
    SECOND_TONE_HERTZ,
    firstToneStart + TONE_DURATION_SECONDS + TONE_GAP_SECONDS
  );
}

export function vibrateIfSupported(): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate([...VIBRATION_PATTERN]);
  } catch {
    return;
  }
}

function playCompletionBeepSafely(context: AudioContext | null): void {
  if (context === null) {
    return;
  }

  try {
    playCompletionBeep(context);
  } catch {
    return;
  }
}

export function createRestAlert(
  resolveConstructor: () => AudioContextConstructor | null = resolveAudioContextConstructor
): RestAlert {
  let context: AudioContext | null = null;

  const openContext = (): AudioContext | null => {
    if (context === null) {
      const AudioContextImplementation = resolveConstructor();

      if (AudioContextImplementation === null) {
        return null;
      }

      try {
        context = new AudioContextImplementation({
          latencyHint: "interactive",
        });
      } catch {
        return null;
      }
    }

    return context;
  };

  return {
    prepare(): void {
      const opened = openContext();

      if (opened !== null && opened.state !== "running") {
        void opened.resume().catch(() => undefined);
      }
    },

    signal(): void {
      playCompletionBeepSafely(openContext());
      vibrateIfSupported();
    },
  };
}
