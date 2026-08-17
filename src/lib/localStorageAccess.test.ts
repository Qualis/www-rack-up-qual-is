import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readJson, subscribeToKey, writeJson } from "./localStorageAccess";

interface Counter {
  count: number;
}

const reviveCounter = (candidate: unknown): Counter | null =>
  typeof candidate === "object" &&
  candidate !== null &&
  typeof (candidate as Counter).count === "number"
    ? (candidate as Counter)
    : null;

describe("readJson", () => {
  let storage: { [key: string]: string };

  beforeEach(() => {
    storage = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should return the stored value when it is present and valid", () => {
    storage["counter"] = JSON.stringify({ count: 7 });

    expect(readJson("counter", reviveCounter)).toEqual({ count: 7 });
  });

  it("should return null when the key has never been written", () => {
    expect(readJson("counter", reviveCounter)).toBeNull();
  });

  it("should return null when the stored value is not valid JSON", () => {
    storage["counter"] = "{not json";

    expect(readJson("counter", reviveCounter)).toBeNull();
  });

  it("should return null when the stored value does not match the expected shape", () => {
    storage["counter"] = JSON.stringify({ count: "seven" });

    expect(readJson("counter", reviveCounter)).toBeNull();
  });

  it("should return null when storage cannot be read, as in a locked-down browser", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => {
          throw new Error("access denied");
        }),
      },
      writable: true,
    });

    expect(readJson("counter", reviveCounter)).toBeNull();
  });

  it("should return null when there is no window, as during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(readJson("counter", reviveCounter)).toBeNull();
  });
});

describe("writeJson", () => {
  let storage: { [key: string]: string };

  beforeEach(() => {
    storage = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should serialise the value under the given key", () => {
    writeJson("counter", { count: 3 });

    expect(storage["counter"]).toBe('{"count":3}');
  });

  it("should report success when the value was stored", () => {
    expect(writeJson("counter", { count: 3 })).toBe(true);
  });

  it("should report failure when the storage quota is exceeded", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: vi.fn(() => {
          throw new DOMException("full", "QuotaExceededError");
        }),
      },
      writable: true,
    });

    expect(writeJson("counter", { count: 3 })).toBe(false);
  });

  it("should report failure when there is no window, as during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(writeJson("counter", { count: 3 })).toBe(false);
  });
});

describe("subscribeToKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should notify the listener when another tab writes the watched key", () => {
    const onExternalChange = vi.fn();
    const unsubscribe = subscribeToKey("counter", onExternalChange);

    window.dispatchEvent(new StorageEvent("storage", { key: "counter" }));
    unsubscribe();

    expect(onExternalChange).toHaveBeenCalledTimes(1);
  });

  it("should notify the listener when another tab clears all storage", () => {
    const onExternalChange = vi.fn();
    const unsubscribe = subscribeToKey("counter", onExternalChange);

    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    unsubscribe();

    expect(onExternalChange).toHaveBeenCalledTimes(1);
  });

  it("should ignore writes to unrelated keys", () => {
    const onExternalChange = vi.fn();
    const unsubscribe = subscribeToKey("counter", onExternalChange);

    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    unsubscribe();

    expect(onExternalChange).not.toHaveBeenCalled();
  });

  it("should stop notifying once unsubscribed", () => {
    const onExternalChange = vi.fn();
    const unsubscribe = subscribeToKey("counter", onExternalChange);

    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: "counter" }));

    expect(onExternalChange).not.toHaveBeenCalled();
  });

  it("should return a no-op disposer when there is no window, as during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(() => subscribeToKey("counter", vi.fn())()).not.toThrow();
  });
});
