# Test Examples from Codebase

This document contains actual test examples from the project demonstrating proper patterns.

## Use Case Test Example

From `src/application/use-cases/GetPostNavigation.test.ts`:

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

  it("should return null for next when viewing the newest post", () => {
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

    expect(result.next).toBeNull();
  });

  it("should return null for previous when viewing the oldest post", () => {
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

    const result = useCase.execute("post-1");

    expect(result.previous).toBeNull();
  });

  it("should return previous post (older) for a middle post", () => {
    repository.addPost(
      "post-1",
      { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" },
      "Content 1"
    );
    repository.addPost(
      "post-2",
      { title: "Post 2", date: new Date("2025-01-10"), topic: "lead" },
      "Content 2"
    );
    repository.addPost(
      "post-3",
      { title: "Post 3", date: new Date("2025-01-15"), topic: "think" },
      "Content 3"
    );

    const result = useCase.execute("post-2");

    expect(result.previous).not.toBeNull();
    expect(result.previous?.slug).toBe("post-1");
    expect(result.previous?.title).toBe("Post 1");
  });

  it("should return only slug and title in navigation links", () => {
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

    expect(result.previous).toHaveProperty("slug");
    expect(result.previous).toHaveProperty("title");
    expect(Object.keys(result.previous || {})).toEqual(["slug", "title"]);
  });
});
```

**Observations:**
- Each `it()` block tests ONE behavior
- `beforeEach` provides clean setup with `InMemoryPostRepository`
- Use case receives repository via constructor injection
- Test names clearly describe behavior with should/when
- Multiple `expect()` calls OK when verifying the same behavior (e.g., previous post slug and title)
- `InMemoryPostRepository` used as test double instead of mocks

## InMemory Repository Test Example

From `src/infrastructure/repositories/InMemoryPostRepository.test.ts`:

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

  it("should retrieve raw post data", () => {
    repository.addPost("test-post", { title: "Test" }, "Content");

    const data = repository.getRawPostData("test-post");

    expect(data).toEqual({
      slug: "test-post",
      frontMatter: { title: "Test" },
      content: "Content",
    });
  });

  it("should strip .md extension when retrieving raw post data", () => {
    repository.addPost("test-post", { title: "Test" }, "Content");

    const data = repository.getRawPostData("test-post.md");

    expect(data.slug).toBe("test-post");
  });

  it("should throw error when post not found", () => {
    expect(() => repository.getRawPostData("non-existent")).toThrow(
      "Post not found: non-existent"
    );
  });

  it("should clear all posts", () => {
    repository.addPost("post-1", { title: "Post 1" }, "Content 1");
    repository.addPost("post-2", { title: "Post 2" }, "Content 2");

    repository.clear();

    expect(repository.getAllSlugs()).toEqual([]);
  });

  it("should add multiple posts", () => {
    repository.addPost("post-1", { title: "Post 1" }, "Content 1");
    repository.addPost("post-2", { title: "Post 2" }, "Content 2");

    const slugs = repository.getAllSlugs();

    expect(slugs).toHaveLength(2);
  });
});
```

**Observations:**
- `beforeEach` creates a fresh repository for each test
- Tests cover happy path, error cases, and edge cases
- `toThrow()` used for error testing without try/catch
- `toEqual()` for deep equality, `toBe()` for strict equality
- Clean AAA structure in every test

## FileSystem Repository Test Example (with vi.spyOn)

From `src/infrastructure/repositories/FileSystemPostRepository.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { FileSystemPostRepository } from "./FileSystemPostRepository";
import fs from "fs";
import { afterEach, vi } from "vitest";

describe("FileSystemPostRepository", () => {
  it("should get all slugs from _posts directory", () => {
    const repository = new FileSystemPostRepository();

    const slugs = repository.getAllSlugs();

    expect(slugs.length).toBeGreaterThan(0);
  });

  it("should retrieve raw post data for a valid slug", () => {
    const repository = new FileSystemPostRepository();
    const slugs = repository.getAllSlugs();
    const firstSlug = slugs[0];

    const data = repository.getRawPostData(firstSlug!);

    expect(data.slug).toBe(firstSlug!.replace(/\.md$/, ""));
    expect(data.frontMatter).toBeDefined();
    expect(data.content).toBeDefined();
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

    it("should throw error when post file has invalid YAML", () => {
      const repository = new FileSystemPostRepository();
      const slugs = repository.getAllSlugs();
      const firstSlug = slugs[0];

      const malformedYaml = `---
title: Test
invalid: [unclosed array
---
content`;

      vi.spyOn(fs, "readFileSync").mockReturnValue(malformedYaml);

      expect(() => repository.getRawPostData(firstSlug!)).toThrow(
        "Failed to parse post file"
      );
    });

    it("should throw error when readFileSync throws", () => {
      const repository = new FileSystemPostRepository();
      const slugs = repository.getAllSlugs();
      const firstSlug = slugs[0];

      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(() => repository.getRawPostData(firstSlug!)).toThrow(
        "Failed to parse post file"
      );
    });

    it("should handle non-Error exceptions in getAllSlugs", () => {
      vi.spyOn(fs, "readdirSync").mockImplementation(() => {
        throw "String error";
      });

      const repository = new FileSystemPostRepository();

      expect(() => repository.getAllSlugs()).toThrow(/String error/);
    });
  });
});
```

**Observations:**
- `vi.spyOn()` used to mock `fs` module methods
- `afterEach(() => vi.restoreAllMocks())` cleans up spies
- Nested `describe("error handling")` groups related error tests
- `mockReturnValue` for simple return values, `mockImplementation` for complex behavior
- Regex patterns in `toThrow(/pattern/)` for partial error message matching

## Container Test Example (DI)

From `src/infrastructure/di/container.test.ts`:

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

  it("should return the same PostRepository instance on multiple calls", () => {
    const container = createContainer();
    const repository1 = container.getPostRepository();
    const repository2 = container.getPostRepository();

    expect(repository1).toBe(repository2);
  });

  it("should allow injecting a custom repository", () => {
    const customRepository = new InMemoryPostRepository();
    const container = createContainer({ postRepository: customRepository });

    expect(container.getPostRepository()).toBe(customRepository);
  });

  it("should provide isolated instances per container", () => {
    const container1 = createContainer();
    const container2 = createContainer();

    const repository1 = container1.getPostRepository();
    const repository2 = container2.getPostRepository();
    const service1 = container1.getPostService();
    const service2 = container2.getPostService();

    expect(repository1).not.toBe(repository2);
    expect(service1).not.toBe(service2);
  });
});
```

**Observations:**
- Tests container wiring: default implementation, singleton behavior, custom injection, isolation
- `toBeInstanceOf()` to verify concrete type
- `toBe()` for reference equality (singleton check)
- `not.toBe()` for isolation verification

## Lib / Utility Test Examples

### markdownToHtml

From `src/lib/markdownToHtml.test.ts`:

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

  it("should convert external markdown links to HTML with target blank", async () => {
    const markdown = "[Link Text](https://example.com)";
    const result = await markdownToHtml(markdown);

    expect(result).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link Text</a>'
    );
  });

  it("should keep anchor links without target blank", async () => {
    const markdown = "[Link Text](#section)";
    const result = await markdownToHtml(markdown);

    expect(result).toContain('<a href="#section">Link Text</a>');
  });

  it("should handle empty markdown", async () => {
    const markdown = "";
    const result = await markdownToHtml(markdown);

    expect(result).toBe("");
  });

  it("should handle markdown with code blocks", async () => {
    const markdown = "```javascript\nconst x = 1;\n```";
    const result = await markdownToHtml(markdown);

    expect(result).toContain("<pre>");
    expect(result).toContain("<code");
  });
});
```

### transformers

From `src/lib/transformers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parsePostData } from "./transformers";

describe("parsePostData", () => {
  it("should auto-generate ogImage when topic and coverImage exist but ogImage does not", () => {
    const result = parsePostData(
      "test-post",
      {
        title: "Test",
        topic: "engineer",
        coverImage: "/custom/cover.png",
      },
      "Content"
    );

    expect(result.ogImage?.url).toBe("/assets/blog/categories/engineer.png");
  });

  it("should not modify images when both coverImage and ogImage exist", () => {
    const result = parsePostData(
      "test-post",
      {
        title: "Test",
        topic: "engineer",
        coverImage: "/custom/cover.png",
        ogImage: { url: "/custom/og.png" },
      },
      "Content"
    );

    expect(result.coverImage).toBe("/custom/cover.png");
    expect(result.ogImage?.url).toBe("/custom/og.png");
  });

  it("should set topic to 'uncategorized' when topic is missing and coverImage doesn't match pattern", () => {
    const result = parsePostData(
      "test-post",
      {
        title: "Test",
        coverImage: "/some/random/image.png",
      },
      "Content"
    );

    expect(result.topic).toBe("uncategorized");
  });
});
```

### constants

From `src/lib/constants.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { HOME_OG_IMAGE_URL } from "./constants";

describe("constants", () => {
  describe("HOME_OG_IMAGE_URL", () => {
    it("should be defined", () => {
      expect(HOME_OG_IMAGE_URL).toBeDefined();
    });

    it("should have the correct URL", () => {
      expect(HOME_OG_IMAGE_URL).toBe(
        "https://qual.is/assets/open-graph-large.png"
      );
    });

    it("should start with https://", () => {
      expect(HOME_OG_IMAGE_URL).toMatch(/^https:\/\//);
    });
  });
});
```

## API Function Test Example (with vi.mock for DI Container)

From `src/app/lib/api.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPostBySlug,
  getAllPosts,
  getAllTopics,
  getPostNavigation,
} from "./api";
import { InMemoryPostRepository } from "@/infrastructure/repositories/InMemoryPostRepository";
import { createContainer, Container } from "@/infrastructure/di/container";

type MockedContainerModule = typeof import("@/infrastructure/di/container") & {
  setTestContainer: (container: Container) => void;
};

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
    const { setTestContainer } = (await import(
      "@/infrastructure/di/container"
    )) as MockedContainerModule;
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

  it("should strip .md extension from slug", () => {
    repository.addPost(
      "test-post",
      { title: "Test Post", topic: "lead" },
      "Content"
    );

    const result = getPostBySlug("test-post.md");

    expect(result.slug).toBe("test-post");
  });

  it("should auto-generate coverImage when topic is provided but coverImage is missing", () => {
    repository.addPost(
      "test-post",
      { title: "Test Post", topic: "manage" },
      "Content"
    );

    const result = getPostBySlug("test-post");

    expect(result.coverImage).toBe("/assets/blog/categories/manage.png");
  });
});

describe("getAllPosts", () => {
  let repository: InMemoryPostRepository;

  beforeEach(async () => {
    const { setTestContainer } = (await import(
      "@/infrastructure/di/container"
    )) as MockedContainerModule;
    repository = new InMemoryPostRepository();
    setTestContainer(createContainer({ postRepository: repository }));
  });

  it("should return all posts", () => {
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

    const results = getAllPosts();

    expect(results).toHaveLength(2);
  });

  it("should return posts with most recent date first", () => {
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

    const results = getAllPosts();

    expect(results[0]?.title).toBe("Post 2");
  });

  it("should return empty array when no posts exist", () => {
    const results = getAllPosts();

    expect(results).toHaveLength(0);
  });
});

describe("getAllTopics", () => {
  let repository: InMemoryPostRepository;

  beforeEach(async () => {
    const { setTestContainer } = (await import(
      "@/infrastructure/di/container"
    )) as MockedContainerModule;
    repository = new InMemoryPostRepository();
    setTestContainer(createContainer({ postRepository: repository }));
  });

  it("should return unique topics in the correct order", () => {
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
    repository.addPost(
      "post-3",
      { title: "Post 3", date: new Date("2025-01-10"), topic: "engineer" },
      "Content 3"
    );

    const results = getAllTopics();

    expect(results).toEqual(["engineer", "lead"]);
  });

  it("should maintain the predefined topic order", () => {
    repository.addPost("post-1", { topic: "think" }, "");
    repository.addPost("post-2", { topic: "manage" }, "");
    repository.addPost("post-3", { topic: "lead" }, "");
    repository.addPost("post-4", { topic: "engineer" }, "");

    const results = getAllTopics();

    expect(results).toEqual(["engineer", "lead", "manage", "think"]);
  });
});

describe("getPostNavigation", () => {
  let repository: InMemoryPostRepository;

  beforeEach(async () => {
    const { setTestContainer } = (await import(
      "@/infrastructure/di/container"
    )) as MockedContainerModule;
    repository = new InMemoryPostRepository();
    setTestContainer(createContainer({ postRepository: repository }));
  });

  it("should return navigation with null next for the newest post", () => {
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

    const result = getPostNavigation("post-2");

    expect(result.next).toBeNull();
    expect(result.previous).not.toBeNull();
  });

  it("should return both previous and next for a middle post", () => {
    repository.addPost(
      "post-1",
      { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" },
      "Content 1"
    );
    repository.addPost(
      "post-2",
      { title: "Post 2", date: new Date("2025-01-10"), topic: "lead" },
      "Content 2"
    );
    repository.addPost(
      "post-3",
      { title: "Post 3", date: new Date("2025-01-15"), topic: "think" },
      "Content 3"
    );

    const result = getPostNavigation("post-2");

    expect(result.previous).not.toBeNull();
    expect(result.next).not.toBeNull();
    expect(result.previous?.slug).toBe("post-1");
    expect(result.next?.slug).toBe("post-3");
  });
});
```

**Observations:**
- `vi.mock()` at module level to override the DI container
- `vi.importActual()` preserves real module behavior while adding test hooks
- `beforeEach` with async import to reset container state per test
- `InMemoryPostRepository` injected into container for each `describe` block
- Type assertion (`as MockedContainerModule`) for the mocked module
- Each `describe` block covers one API function with its own setup

## Pattern Summary

| Pattern | When to Use | Example |
|---|---|---|
| `InMemoryPostRepository` | Use case and service tests | Constructor injection |
| `vi.mock()` | Module-level mocking (DI container) | Override container export |
| `vi.spyOn()` | Spy on specific function calls | Mock `fs.readFileSync` |
| `beforeEach` | Fresh state per test | Reset repository/container |
| `afterEach` + `vi.restoreAllMocks()` | Clean up spies | After `vi.spyOn()` usage |
| `toThrow()` | Error testing | `expect(() => fn()).toThrow("msg")` |
| `toEqual()` | Deep equality | Objects, arrays |
| `toBe()` | Strict reference equality | Primitives, singleton checks |
| `toContain()` | Substring/array membership | HTML output, arrays |
| `toBeInstanceOf()` | Type verification | Container wiring |
