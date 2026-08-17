---
name: Test Generator with One-Behavior Rule
description: This skill should be used when the user asks to "generate tests", "create tests for", "write test cases", "add test coverage", "write tests", or "test this code". This skill generates tests following the project's strict one-behavior-per-test rule with proper naming and structure.
version: 1.0.0
---

# Test Generator with One-Behavior Rule

## Overview

This skill generates tests following the project's mandatory testing standards:
- **One behavior per test** (each `it()` block tests a single behavior or concept)
- **Descriptive test names** using `it("should [expected] when [condition]")` pattern
- **Arrange-Act-Assert (AAA) structure** for clarity
- **Proper test doubles** using `InMemoryPostRepository` or `vi.mock()`/`vi.spyOn()`
- **100% coverage** requirement via V8 provider

## When to Use This Skill

Use this skill when:
- Creating tests for new code
- Adding missing test coverage
- Refactoring tests that violate the one-behavior rule
- Converting unfocused tests into separate `it()` blocks

## Critical Rule: ONE BEHAVIOR PER TEST

Each `it()` block MUST test ONE behavior or concept. Multiple `expect()` calls are acceptable when verifying aspects of the same behavior.

### Wrong (Multiple Unrelated Behaviors)
```typescript
it("works", () => {
  const result = useCase.execute("slug");
  expect(result.previous).toBeNull();
  expect(result.next).not.toBeNull();
  expect(otherUseCase.execute()).toHaveLength(3);
});
```

### Correct (Focused on One Behavior)
```typescript
it("should return null for previous when viewing the oldest post", () => {
  repository.addPost("post-1", { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" }, "Content 1");
  repository.addPost("post-2", { title: "Post 2", date: new Date("2025-01-15"), topic: "lead" }, "Content 2");

  const result = useCase.execute("post-1");

  expect(result.previous).toBeNull();
});

it("should return next post when viewing the oldest post", () => {
  repository.addPost("post-1", { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" }, "Content 1");
  repository.addPost("post-2", { title: "Post 2", date: new Date("2025-01-15"), topic: "lead" }, "Content 2");

  const result = useCase.execute("post-1");

  expect(result.next).not.toBeNull();
  expect(result.next?.slug).toBe("post-2");
});
```

## Test Naming Convention

Tests use `describe`/`it` blocks with descriptive sentences:

```typescript
describe("GetPostNavigationUseCase", () => {
  it("should return null for both previous and next when post is not found", () => {
    // ...
  });

  it("should return previous post when viewing the newest of two posts", () => {
    // ...
  });
});
```

### Naming Tips
- Start with `"should `
- Describe the expected outcome (what should happen)
- Include `when` followed by the condition or trigger
- Be specific and descriptive
- Use full words, not abbreviations

## Test Structure: Arrange-Act-Assert (AAA)

Every test should follow this three-part structure:

```typescript
it("should return empty array when no posts exist", () => {
  const repository = new InMemoryPostRepository();

  const slugs = repository.getAllSlugs();

  expect(slugs).toEqual([]);
});
```

### Section Guidelines

**Arrange:**
- Create test data
- Set up test doubles and their state
- Initialize the object under test with dependencies
- Use `beforeEach` for shared setup across tests in a `describe` block

**Act:**
- Execute the single method or behavior being tested
- Store the result if needed for assertion
- Should typically be one line

**Assert:**
- Verify the expected outcome using Vitest `expect()`
- Multiple `expect()` calls are fine when they verify the same behavior
- Use `toThrow()` for exception testing

## Testing by Layer

### Domain Interface Tests

Verify repository interfaces are properly defined:

```typescript
import { describe, it, expect } from "vitest";
import { InMemoryPostRepository } from "@/infrastructure/repositories/InMemoryPostRepository";

describe("IPostRepository", () => {
  it("should define getAllSlugs method", () => {
    const repository = new InMemoryPostRepository();

    expect(repository.getAllSlugs).toBeDefined();
  });

  it("should define getRawPostData method", () => {
    const repository = new InMemoryPostRepository();

    expect(repository.getRawPostData).toBeDefined();
  });
});
```

### Repository Implementation Tests (Infrastructure)

Test concrete repository implementations with `beforeEach` for fresh state:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryPostRepository } from "./InMemoryPostRepository";

describe("InMemoryPostRepository", () => {
  let repository: InMemoryPostRepository;

  beforeEach(() => {
    repository = new InMemoryPostRepository();
  });

  it("should return empty array when no posts exist", () => {
    const slugs = repository.getAllSlugs();

    expect(slugs).toEqual([]);
  });

  it("should add and retrieve a post", () => {
    repository.addPost("test-post", { title: "Test" }, "Content");

    const slugs = repository.getAllSlugs();

    expect(slugs).toEqual(["test-post.md"]);
  });

  it("should throw error when post not found", () => {
    expect(() => repository.getRawPostData("non-existent")).toThrow(
      "Post not found: non-existent"
    );
  });
});
```

### Use Case Tests (Application)

Test use cases with `InMemoryPostRepository` as test double:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { GetPostNavigationUseCase } from "./GetPostNavigation";
import { InMemoryPostRepository } from "@/infrastructure/repositories/InMemoryPostRepository";

describe("GetPostNavigationUseCase", () => {
  let repository: InMemoryPostRepository;
  let useCase: GetPostNavigationUseCase;

  beforeEach(() => {
    repository = new InMemoryPostRepository();
    useCase = new GetPostNavigationUseCase(repository);
  });

  it("should return null for both previous and next when post is not found", () => {
    repository.addPost(
      "post-1",
      { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" },
      "Content 1"
    );

    const result = useCase.execute("non-existent-slug");

    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
  });

  it("should return previous post when viewing the newest of two posts", () => {
    repository.addPost(
      "post-1",
      { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" },
      "Content 1"
    );
    repository.addPost(
      "post-2",
      { title: "Post 2", date: new Date("2025-01-15"), topic: "lead" },
      "Content 2"
    );

    const result = useCase.execute("post-2");

    expect(result.previous).not.toBeNull();
    expect(result.previous?.slug).toBe("post-1");
    expect(result.next).toBeNull();
  });
});
```

### Service / API Function Tests

Test application services with `vi.mock()` for module mocking and `InMemoryPostRepository` for the DI container:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPostBySlug } from "./api";
import { InMemoryPostRepository } from "@/infrastructure/repositories/InMemoryPostRepository";
import { createContainer } from "@/infrastructure/di/container";

vi.mock("@/infrastructure/di/container", async () => {
  const actual = await vi.importActual<
    typeof import("@/infrastructure/di/container")
  >("@/infrastructure/di/container");
  let testContainer = actual.createContainer();
  return {
    ...actual,
    get container() {
      return testContainer;
    },
    setTestContainer: (
      container: ReturnType<typeof actual.createContainer>
    ) => {
      testContainer = container;
    },
  };
});

describe("getPostBySlug", () => {
  let repository: InMemoryPostRepository;

  beforeEach(async () => {
    const { setTestContainer } = await import(
      "@/infrastructure/di/container"
    ) as { setTestContainer: (c: ReturnType<typeof createContainer>) => void };
    repository = new InMemoryPostRepository();
    setTestContainer(createContainer({ postRepository: repository }));
  });

  it("should parse the post title correctly", () => {
    repository.addPost(
      "test-post",
      { title: "Test Post", date: new Date("2025-01-08"), topic: "engineer" },
      "# Test Content"
    );

    const result = getPostBySlug("test-post");

    expect(result.title).toBe("Test Post");
  });
});
```

### Container Tests (Infrastructure DI)

Test DI container wiring and isolation:

```typescript
import { describe, it, expect } from "vitest";
import { createContainer } from "./container";
import { InMemoryPostRepository } from "../repositories/InMemoryPostRepository";
import { FileSystemPostRepository } from "../repositories/FileSystemPostRepository";

describe("Container", () => {
  it("should return a PostRepository instance", () => {
    const container = createContainer();
    const repository = container.getPostRepository();

    expect(repository).toBeInstanceOf(FileSystemPostRepository);
  });

  it("should allow injecting a custom repository", () => {
    const customRepository = new InMemoryPostRepository();
    const container = createContainer({ postRepository: customRepository });

    expect(container.getPostRepository()).toBe(customRepository);
  });

  it("should return the same PostRepository instance on multiple calls", () => {
    const container = createContainer();
    const repository1 = container.getPostRepository();
    const repository2 = container.getPostRepository();

    expect(repository1).toBe(repository2);
  });
});
```

### Lib / Utility Tests

Test pure utility functions directly:

```typescript
import { describe, it, expect } from "vitest";
import markdownToHtml from "./markdownToHtml";

describe("markdownToHtml", () => {
  it("should convert basic markdown to HTML", async () => {
    const markdown = "This is a paragraph.";
    const result = await markdownToHtml(markdown);

    expect(result).toContain("<p>This is a paragraph.</p>");
  });

  it("should add IDs to h1 headers", async () => {
    const markdown = "# Hello World";
    const result = await markdownToHtml(markdown);

    expect(result).toContain('<h1 id="hello-world">Hello World</h1>');
  });

  it("should handle empty markdown", async () => {
    const result = await markdownToHtml("");

    expect(result).toBe("");
  });
});
```

## Mocking Guidelines

### When to Use InMemory Test Doubles (Preferred)

- **Use case tests** - inject `InMemoryPostRepository` via constructor
- **Service tests** - inject via DI container override
- Prefer real in-memory implementations over mocks for repository dependencies

### When to Use vi.mock() / vi.spyOn()

- **Module mocking** - override module exports (e.g., DI container)
- **File system operations** - mock `fs` module calls
- **External dependencies** - APIs, databases, network calls

### What NOT to Mock

- **The object under test** itself
- **Simple data types** and constants
- **Pure utility functions** (test them directly)

### Mock Patterns

```typescript
import { vi, afterEach } from "vitest";
import fs from "fs";

vi.mock("@/infrastructure/di/container", async () => {
  const actual = await vi.importActual<
    typeof import("@/infrastructure/di/container")
  >("@/infrastructure/di/container");
  let testContainer = actual.createContainer();
  return {
    ...actual,
    get container() {
      return testContainer;
    },
    setTestContainer: (container: ReturnType<typeof actual.createContainer>) => {
      testContainer = container;
    },
  };
});

vi.spyOn(fs, "readFileSync").mockReturnValue("mocked content");

vi.spyOn(fs, "readFileSync").mockImplementation(() => {
  throw new Error("Permission denied");
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Common Testing Patterns

### Testing Exceptions

```typescript
it("should throw error when post not found", () => {
  expect(() => repository.getRawPostData("non-existent")).toThrow(
    "Post not found: non-existent"
  );
});

it("should throw error with original error message when directory read fails", () => {
  const repository = new FileSystemPostRepository("/nonexistent/path");

  expect(() => repository.getAllSlugs()).toThrow(/Original error:/);
});
```

### Testing with beforeEach Setup

```typescript
describe("InMemoryPostRepository", () => {
  let repository: InMemoryPostRepository;

  beforeEach(() => {
    repository = new InMemoryPostRepository();
  });

  it("should return empty array when no posts exist", () => {
    const slugs = repository.getAllSlugs();

    expect(slugs).toEqual([]);
  });

  it("should clear all posts", () => {
    repository.addPost("post-1", { title: "Post 1" }, "Content 1");
    repository.addPost("post-2", { title: "Post 2" }, "Content 2");

    repository.clear();

    expect(repository.getAllSlugs()).toEqual([]);
  });
});
```

### Testing Async Functions

```typescript
it("should convert markdown to HTML", async () => {
  const markdown = "**bold text**";

  const result = await markdownToHtml(markdown);

  expect(result).toContain("<strong>bold text</strong>");
});
```

### Nested Describe Blocks

```typescript
describe("FileSystemPostRepository", () => {
  it("should get all slugs from _posts directory", () => {
    const repository = new FileSystemPostRepository();
    const slugs = repository.getAllSlugs();

    expect(slugs.length).toBeGreaterThan(0);
  });

  describe("error handling", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should throw error when posts directory does not exist", () => {
      const repository = new FileSystemPostRepository("/nonexistent/path");

      expect(() => repository.getAllSlugs()).toThrow(
        'Failed to read posts directory at "/nonexistent/path"'
      );
    });
  });
});
```

## Test File Organization

### File Location and Naming
- Test files are **colocated** with source files (same directory)
- Suffix with `.test.ts`: `InMemoryPostRepository.test.ts`
- Mirror the source file name: `GetPostNavigation.ts` -> `GetPostNavigation.test.ts`

### Structure Within a Test File
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { GetPostNavigationUseCase } from "./GetPostNavigation";
import { InMemoryPostRepository } from "@/infrastructure/repositories/InMemoryPostRepository";

describe("GetPostNavigationUseCase", () => {
  let repository: InMemoryPostRepository;
  let useCase: GetPostNavigationUseCase;

  beforeEach(() => {
    repository = new InMemoryPostRepository();
    useCase = new GetPostNavigationUseCase(repository);
  });

  it("should return null for previous when viewing the oldest post", () => {
    // ...
  });

  it("should return next post for a middle post", () => {
    // ...
  });
});
```

## Assertion Reference

### Using Vitest expect()

```typescript
expect(result).toBe(expected);
expect(result).toEqual(expected);
expect(result).toEqual([]);
expect(result).toHaveLength(3);
expect(result).toBeDefined();
expect(result).toBeNull();
expect(result).not.toBeNull();
expect(result).toContain("substring");
expect(result).not.toContain("substring");
expect(result).toMatch(/regex/);
expect(result).toBeInstanceOf(MyClass);
expect(result).toBeGreaterThan(5);
expect(result).toHaveProperty("key");
expect(Object.keys(result)).toEqual(["slug", "title"]);
expect(typeof result).toBe("string");
expect(() => fn()).toThrow("error message");
expect(() => fn()).toThrow(/partial match/);
```

## Coverage Requirements

- **100% test coverage** is mandatory (lines, functions, branches, statements)
- Every function, class, and method must have tests
- Tests must be meaningful, not just coverage-seeking
- Use `npm run test:coverage` to verify coverage

```bash
npm run test:coverage

npx vitest run src/path/to/file.test.ts

npm test

npm run test:all
```

## Test Checklist

Before completing test generation, verify:

- [ ] Each `it()` block tests ONE behavior
- [ ] Test names follow `"should X when Y"` pattern
- [ ] Tests use Arrange-Act-Assert structure
- [ ] `InMemoryPostRepository` used as test double for repository dependencies
- [ ] `vi.mock()` / `vi.spyOn()` used only for module-level mocking
- [ ] Tests are isolated via `beforeEach` setup
- [ ] All edge cases covered (happy path, errors, boundaries)
- [ ] Tests verified with `npm run test:all` (NOT just `npx vitest`)
- [ ] Coverage is 100%: confirmed by `npm run test:coverage`

## Common Mistakes to Avoid

1. **Testing multiple unrelated behaviors** - Split into separate `it()` blocks
2. **Vague test names** - Use descriptive names with should/when
3. **Testing implementation details** - Test behavior, not internals
4. **Not using InMemory test doubles** - Prefer them over mocks for repositories
5. **Shared mutable state between tests** - Use `beforeEach` for fresh setup
6. **Missing edge cases** - Test happy path, errors, and boundaries
7. **No AAA structure** - Always use Arrange-Act-Assert
8. **Using `npx vitest` for final verification** - Use `npm run test:all` to pass all quality gates
9. **Forgetting `afterEach(() => vi.restoreAllMocks())`** - Always clean up spies
10. **Not colocating test files** - Tests live next to source files, not in a separate directory

## References

See the `references/` directory for:
- Complete test examples from the codebase
- Test patterns by layer
- Common testing scenarios
