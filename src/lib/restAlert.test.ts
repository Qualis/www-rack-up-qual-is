import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import {
  createRestAlert,
  playCompletionBeep,
  resolveAudioContextConstructor,
  scheduleTone,
  vibrateIfSupported,
} from "./restAlert";

interface MockGainNode {
  gain: {
    setValueAtTime: Mock;
    exponentialRampToValueAtTime: Mock;
  };
  connect: Mock;
}

interface MockOscillatorNode {
  type: string;
  frequency: { setValueAtTime: Mock };
  connect: Mock;
  start: Mock;
  stop: Mock;
}

interface MockAudioContext {
  currentTime: number;
  destination: object;
  state: string;
  resume: Mock;
  createGain: Mock;
  createOscillator: Mock;
  gainNodes: MockGainNode[];
  oscillatorNodes: MockOscillatorNode[];
}

function createMockAudioContext(state = "running"): MockAudioContext {
  const gainNodes: MockGainNode[] = [];
  const oscillatorNodes: MockOscillatorNode[] = [];

  return {
    currentTime: 10,
    destination: {},
    state,
    resume: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(() => {
      const node: MockGainNode = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      gainNodes.push(node);
      return node;
    }),
    createOscillator: vi.fn(() => {
      const node: MockOscillatorNode = {
        type: "",
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillatorNodes.push(node);
      return node;
    }),
    gainNodes,
    oscillatorNodes,
  };
}

function constructorFor(context: MockAudioContext) {
  return vi.fn(() => context) as unknown as new (
    options?: AudioContextOptions
  ) => AudioContext;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resolveAudioContextConstructor", () => {
  it("should return null when there is no window, as during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(resolveAudioContextConstructor()).toBeNull();
  });

  it("should return the standard constructor when the browser exposes it", () => {
    const standard = constructorFor(createMockAudioContext());
    vi.stubGlobal("window", { AudioContext: standard });

    expect(resolveAudioContextConstructor()).toBe(standard);
  });

  it("should fall back to the prefixed constructor on legacy WebKit", () => {
    const prefixed = constructorFor(createMockAudioContext());
    vi.stubGlobal("window", { webkitAudioContext: prefixed });

    expect(resolveAudioContextConstructor()).toBe(prefixed);
  });

  it("should return null when the browser has no Web Audio support at all", () => {
    vi.stubGlobal("window", {});

    expect(resolveAudioContextConstructor()).toBeNull();
  });
});

describe("scheduleTone", () => {
  it("should start the oscillator at the requested time", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(context.oscillatorNodes[0]?.start).toHaveBeenCalledWith(1);
  });

  it("should stop the oscillator when the tone ends", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(context.oscillatorNodes[0]?.stop).toHaveBeenCalledWith(1.15);
  });

  it("should set the requested pitch on the oscillator", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(
      context.oscillatorNodes[0]?.frequency.setValueAtTime
    ).toHaveBeenCalledWith(880, 1);
  });

  it("should ramp the gain up from silence so the tone does not click on attack", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(
      context.gainNodes[0]?.gain.exponentialRampToValueAtTime
    ).toHaveBeenCalledWith(0.18, 1.012);
  });

  it("should ramp the gain back to near silence so the tone does not click on release", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(
      context.gainNodes[0]?.gain.exponentialRampToValueAtTime
    ).toHaveBeenCalledWith(0.0001, 1.15);
  });

  it("should land on true silence once the tone has ended", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(context.gainNodes[0]?.gain.setValueAtTime).toHaveBeenCalledWith(
      0,
      1.15
    );
  });

  it("should route the oscillator through the envelope to the destination", () => {
    const context = createMockAudioContext();

    scheduleTone(context as unknown as AudioContext, 880, 1);

    expect(context.gainNodes[0]?.connect).toHaveBeenCalledWith(
      context.destination
    );
  });
});

describe("playCompletionBeep", () => {
  it("should play two tones so the finish reads as a signal rather than a stray noise", () => {
    const context = createMockAudioContext();

    playCompletionBeep(context as unknown as AudioContext);

    expect(context.oscillatorNodes).toHaveLength(2);
  });

  it("should schedule the first tone slightly ahead of the current time", () => {
    const context = createMockAudioContext();

    playCompletionBeep(context as unknown as AudioContext);

    expect(context.oscillatorNodes[0]?.start).toHaveBeenCalledWith(10.02);
  });

  it("should schedule the second tone after the first has finished", () => {
    const context = createMockAudioContext();

    playCompletionBeep(context as unknown as AudioContext);

    expect(context.oscillatorNodes[1]?.start).toHaveBeenCalledWith(10.22);
  });

  it("should rise in pitch between the two tones", () => {
    const context = createMockAudioContext();

    playCompletionBeep(context as unknown as AudioContext);

    expect(
      context.oscillatorNodes[1]?.frequency.setValueAtTime
    ).toHaveBeenCalledWith(1318.51, 10.22);
  });
});

describe("vibrateIfSupported", () => {
  it("should do nothing when there is no navigator, as during server rendering", () => {
    vi.stubGlobal("navigator", undefined);

    expect(() => vibrateIfSupported()).not.toThrow();
  });

  it("should do nothing on a browser without the vibration API", () => {
    vi.stubGlobal("navigator", {});

    expect(() => vibrateIfSupported()).not.toThrow();
  });

  it("should vibrate with a double pulse when the device supports it", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });

    vibrateIfSupported();

    expect(vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });

  it("should swallow a vibration failure rather than interrupting the workout", () => {
    vi.stubGlobal("navigator", {
      vibrate: vi.fn(() => {
        throw new Error("vibration unavailable");
      }),
    });

    expect(() => vibrateIfSupported()).not.toThrow();
  });
});

describe("createRestAlert", () => {
  it("should resume a suspended context so the browser autoplay policy is satisfied", () => {
    const context = createMockAudioContext("suspended");
    const alert = createRestAlert(() => constructorFor(context));

    alert.prepare();

    expect(context.resume).toHaveBeenCalled();
  });

  it("should leave an already running context alone", () => {
    const context = createMockAudioContext("running");
    const alert = createRestAlert(() => constructorFor(context));

    alert.prepare();

    expect(context.resume).not.toHaveBeenCalled();
  });

  it("should resume a context interrupted by a screen lock on iOS", () => {
    const context = createMockAudioContext("interrupted");
    const alert = createRestAlert(() => constructorFor(context));

    alert.prepare();

    expect(context.resume).toHaveBeenCalled();
  });

  it("should swallow a rejected resume rather than surfacing an unhandled rejection", async () => {
    const context = createMockAudioContext("suspended");
    context.resume = vi.fn(() => Promise.reject(new Error("blocked")));
    const alert = createRestAlert(() => constructorFor(context));

    alert.prepare();

    await expect(context.resume.mock.results[0]?.value).rejects.toThrow(
      "blocked"
    );
  });

  it("should tolerate preparing on a browser with no Web Audio support", () => {
    const alert = createRestAlert(() => null);

    expect(() => alert.prepare()).not.toThrow();
  });

  it("should tolerate signalling on a browser with no Web Audio support", () => {
    const alert = createRestAlert(() => null);

    expect(() => alert.signal()).not.toThrow();
  });

  it("should play the beep when signalled", () => {
    const context = createMockAudioContext();
    const alert = createRestAlert(() => constructorFor(context));

    alert.signal();

    expect(context.oscillatorNodes).toHaveLength(2);
  });

  it("should reuse a single audio context across the whole session", () => {
    const context = createMockAudioContext();
    const resolveConstructor = vi.fn(() => constructorFor(context));
    const alert = createRestAlert(resolveConstructor);

    alert.prepare();
    alert.signal();

    expect(resolveConstructor).toHaveBeenCalledTimes(1);
  });

  it("should stay silent rather than throwing when the audio context cannot be created", () => {
    const alert = createRestAlert(
      () =>
        vi.fn(() => {
          throw new Error("too many audio contexts");
        }) as unknown as new (options?: AudioContextOptions) => AudioContext
    );

    expect(() => alert.signal()).not.toThrow();
  });

  it("should stay silent rather than throwing when the context rejects new nodes", () => {
    const context = createMockAudioContext();
    context.createOscillator = vi.fn(() => {
      throw new DOMException("closed", "InvalidStateError");
    });
    const alert = createRestAlert(() => constructorFor(context));

    expect(() => alert.signal()).not.toThrow();
  });

  it("should still vibrate when the beep could not be played", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    const context = createMockAudioContext();
    context.createOscillator = vi.fn(() => {
      throw new DOMException("closed", "InvalidStateError");
    });
    const alert = createRestAlert(() => constructorFor(context));

    alert.signal();

    expect(vibrate).toHaveBeenCalled();
  });

  it("should fall back to the browser constructor when none is injected", () => {
    const context = createMockAudioContext();
    vi.stubGlobal("window", { AudioContext: constructorFor(context) });
    const alert = createRestAlert();

    alert.signal();

    expect(context.oscillatorNodes).toHaveLength(2);
  });
});
