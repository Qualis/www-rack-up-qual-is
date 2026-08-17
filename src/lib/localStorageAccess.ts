export function readJson<T>(
  key: string,
  revive: (candidate: unknown) => T | null
): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const serialised = window.localStorage.getItem(key);

    if (serialised === null) {
      return null;
    }

    return revive(JSON.parse(serialised));
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToKey(
  key: string,
  onExternalChange: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key === key) {
      onExternalChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => window.removeEventListener("storage", handleStorage);
}
