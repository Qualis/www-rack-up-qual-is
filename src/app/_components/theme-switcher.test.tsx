import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeSwitcher, NoFOUCScript } from "./theme-switcher";

interface MockClassList {
  add: Mock;
  remove: Mock;
  contains: Mock;
}

interface MockStyleElement {
  textContent: string;
}

interface MockHead {
  appendChild: Mock;
  removeChild: Mock;
}

interface MockDocumentElement {
  classList: MockClassList;
  setAttribute: Mock;
}

interface MockMatchMedia {
  matches: boolean;
  addEventListener: Mock;
}

describe("ThemeSwitcher", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: vi.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });

    window.updateDOM = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render theme switcher button", () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("should render with default system mode", () => {
    render(<ThemeSwitcher />);
    expect(localStorage.getItem).toHaveBeenCalledWith("rackup-theme");
    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "system");
  });

  it("should cycle from system to dark mode", () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    fireEvent.click(button);

    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "dark");
  });

  it("should cycle from dark to light mode", () => {
    localStorageMock["rackup-theme"] = "dark";

    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    fireEvent.click(button);

    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "light");
  });

  it("should cycle from light back to system mode", () => {
    localStorageMock["rackup-theme"] = "light";

    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    fireEvent.click(button);

    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "system");
  });

  it("should call updateDOM when mode changes", async () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(window.updateDOM).toHaveBeenCalled();
    });
  });

  it("should not throw when window.updateDOM is undefined", () => {
    const originalUpdateDOM = window.updateDOM;
    window.updateDOM = undefined as unknown as () => void;

    expect(() => render(<ThemeSwitcher />)).not.toThrow();

    window.updateDOM = originalUpdateDOM;
  });

  it("should have aria-label for accessibility", () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toHaveAttribute("aria-label", "Toggle theme");
  });

  it("should render button element", () => {
    const { container } = render(<ThemeSwitcher />);
    const button = container.querySelector("button");
    expect(button).toBeInTheDocument();
  });

  it("should render Script component", () => {
    const { container } = render(<ThemeSwitcher />);
    const script = container.querySelector("script");
    expect(script).toBeInTheDocument();
  });

  it("should have correct script content", () => {
    const { container } = render(<ThemeSwitcher />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("rackup-theme");
  });

  it("should persist mode to localStorage on mount", () => {
    localStorageMock["rackup-theme"] = "dark";

    render(<ThemeSwitcher />);

    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "dark");
  });

  it("should handle storage event and update mode", async () => {
    render(<ThemeSwitcher />);

    const storageEvent = new StorageEvent("storage", {
      key: "rackup-theme",
      newValue: "dark",
    });

    window.dispatchEvent(storageEvent);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "dark");
    });
  });

  it("should ignore storage events for other keys", async () => {
    render(<ThemeSwitcher />);
    const setItemMock = localStorage.setItem as unknown as Mock;
    const initialCallCount = setItemMock.mock.calls.length;

    const storageEvent = new StorageEvent("storage", {
      key: "other-key",
      newValue: "some-value",
    });

    window.dispatchEvent(storageEvent);

    await waitFor(() => {
      expect(setItemMock.mock.calls.length).toBe(initialCallCount);
    });
  });

  it("should initialize from localStorage if available", () => {
    localStorageMock["rackup-theme"] = "light";

    render(<ThemeSwitcher />);

    expect(localStorage.getItem).toHaveBeenCalledWith("rackup-theme");
  });

  it("should handle multiple mode switches", () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    fireEvent.click(button);
    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "dark");

    fireEvent.click(button);
    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "light");

    fireEvent.click(button);
    expect(localStorage.setItem).toHaveBeenCalledWith("rackup-theme", "system");
  });

  it("should set up storage event listener on mount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    render(<ThemeSwitcher />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "storage",
      expect.any(Function)
    );
  });
});

describe("NoFOUCScript", () => {
  let mockClassList: MockClassList;
  let mockMatchMedia: MockMatchMedia;
  let mockHead: MockHead;
  let mockStyleElement: MockStyleElement;
  let mockDocumentElement: MockDocumentElement;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};

    mockClassList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    };

    mockStyleElement = {
      textContent: "",
    };

    mockHead = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    mockDocumentElement = {
      classList: mockClassList,
      setAttribute: vi.fn(),
    };

    mockMatchMedia = {
      matches: false,
      addEventListener: vi.fn(),
    };

    Object.defineProperty(global, "document", {
      value: {
        createElement: vi.fn(() => mockStyleElement),
        head: mockHead,
        body: {},
        documentElement: mockDocumentElement,
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, "matchMedia", {
      value: vi.fn(() => mockMatchMedia),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, "getComputedStyle", {
      value: vi.fn(() => ({})),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
      },
      writable: true,
      configurable: true,
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete (window as unknown as { updateDOM?: () => void }).updateDOM;
  });

  it("should create and set up window.updateDOM function", () => {
    NoFOUCScript("rackup-theme");

    expect(window.updateDOM).toBeDefined();
    expect(typeof window.updateDOM).toBe("function");
  });

  it("should add dark class when localStorage has dark mode", () => {
    localStorageMock["rackup-theme"] = "dark";

    NoFOUCScript("rackup-theme");

    expect(mockClassList.add).toHaveBeenCalledWith("dark");
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-mode",
      "dark"
    );
  });

  it("should remove dark class when localStorage has light mode", () => {
    localStorageMock["rackup-theme"] = "light";

    NoFOUCScript("rackup-theme");

    expect(mockClassList.remove).toHaveBeenCalledWith("dark");
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-mode",
      "light"
    );
  });

  it("should use system dark preference when mode is system and prefers dark", () => {
    localStorageMock["rackup-theme"] = "system";
    mockMatchMedia.matches = true;

    NoFOUCScript("rackup-theme");

    expect(mockClassList.add).toHaveBeenCalledWith("dark");
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-mode",
      "system"
    );
  });

  it("should use system light preference when mode is system and prefers light", () => {
    localStorageMock["rackup-theme"] = "system";
    mockMatchMedia.matches = false;

    NoFOUCScript("rackup-theme");

    expect(mockClassList.remove).toHaveBeenCalledWith("dark");
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-mode",
      "system"
    );
  });

  it("should default to system mode when localStorage is empty", () => {
    NoFOUCScript("rackup-theme");

    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith(
      "data-mode",
      "system"
    );
  });

  it("should set up media query change listener", () => {
    NoFOUCScript("rackup-theme");

    expect(mockMatchMedia.addEventListener).toHaveBeenCalledWith(
      "change",
      window.updateDOM
    );
  });

  it("should create style element to disable transitions", () => {
    NoFOUCScript("rackup-theme");

    expect(document.createElement).toHaveBeenCalledWith("style");
    expect(mockStyleElement.textContent).toBe(
      "*,*:after,*:before{transition:none !important;}"
    );
    expect(mockHead.appendChild).toHaveBeenCalledWith(mockStyleElement);
  });

  it("should remove style element after applying classes", () => {
    NoFOUCScript("rackup-theme");

    vi.runAllTimers();

    expect(mockHead.removeChild).toHaveBeenCalledWith(mockStyleElement);
  });

  it("should call updateDOM immediately on initialization", () => {
    const addSpy = vi.spyOn(mockClassList, "add");
    localStorageMock["rackup-theme"] = "dark";

    NoFOUCScript("rackup-theme");

    expect(addSpy).toHaveBeenCalled();
  });

  it("should force reflow by calling getComputedStyle", () => {
    NoFOUCScript("rackup-theme");

    expect(getComputedStyle).toHaveBeenCalledWith(document.body);
  });
});
