# Existing Post Feature Reference

This document shows the complete structure of the existing Post feature as the reference implementation of the hexagonal architecture pattern.

## File Structure

```
src/
├── domain/
│   └── repositories/
│       ├── IPostRepository.ts              # Port interface
│       └── IPostRepository.test.ts         # Port interface tests
├── application/
│   ├── use-cases/
│   │   ├── GetPostBySlug.ts                # Single post retrieval
│   │   ├── GetPostBySlug.test.ts
│   │   ├── GetAllPosts.ts                  # All posts listing
│   │   ├── GetAllPosts.test.ts
│   │   ├── GetPostNavigation.ts            # Previous/next navigation
│   │   ├── GetPostNavigation.test.ts
│   │   ├── GetAllTopics.ts                 # Topic extraction
│   │   └── GetAllTopics.test.ts
│   └── services/
│       ├── PostService.ts                  # Orchestrates use cases
│       └── PostService.test.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── FileSystemPostRepository.ts     # Production adapter (reads .md files)
│   │   ├── FileSystemPostRepository.test.ts
│   │   ├── InMemoryPostRepository.ts       # Test double adapter
│   │   └── InMemoryPostRepository.test.ts
│   └── di/
│       ├── container.ts                    # Dependency injection container
│       └── container.test.ts
└── interfaces/
    └── Post.ts                             # Shared type definitions
```

## Key Implementation Patterns

### Domain Layer: Port Interface

`IPostRepository` defines the contract that all adapters must implement. It uses a TypeScript interface with no external dependencies.

```typescript
export interface IPostRepository {
  getAllSlugs(): string[];
  getRawPostData(slug: string): RawPostData;
}
```

### Infrastructure Layer: InMemory Adapter

`InMemoryPostRepository` implements the port interface with an in-memory Map. It provides helper methods like `addPost()` for populating test data. This is the preferred test double for all use case and service tests.

```typescript
export class InMemoryPostRepository implements IPostRepository {
  private readonly posts: Map<string, { metadata: PostMetadata; content: string }> = new Map();

  addPost(slug: string, metadata: PostMetadata, content: string): void {
    this.posts.set(slug, { metadata, content });
  }

  getAllSlugs(): string[] {
    return Array.from(this.posts.keys());
  }

  getRawPostData(slug: string): RawPostData {
    const post = this.posts.get(slug);
    if (!post) {
      throw new Error(`Post with slug "${slug}" not found`);
    }
    return { metadata: post.metadata, content: post.content };
  }
}
```

### Infrastructure Layer: FileSystem Adapter

`FileSystemPostRepository` implements the same port interface by reading markdown files from the filesystem. This is the production implementation.

```typescript
export class FileSystemPostRepository implements IPostRepository {
  private readonly postsDirectory: string;

  constructor(postsDirectory: string = path.join(process.cwd(), "content/posts")) {
    this.postsDirectory = postsDirectory;
  }

  getAllSlugs(): string[] {
    return fs.readdirSync(this.postsDirectory)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
  }

  getRawPostData(slug: string): RawPostData {
    const fullPath = path.join(this.postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    return this.parseFileContents(fileContents);
  }
}
```

### Application Layer: Use Cases

Each use case is a single-purpose class with constructor injection. Use cases depend on `IPostRepository` (the port interface), never on a concrete implementation.

**GetPostBySlug** - Retrieves a single post by its slug:
```typescript
export class GetPostBySlugUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): Post {
    const rawData = this.postRepository.getRawPostData(slug);
    return this.transformToPost(slug, rawData);
  }
}
```

**GetAllPosts** - Returns all posts sorted by date:
```typescript
export class GetAllPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(): Post[] {
    const slugs = this.postRepository.getAllSlugs();
    return slugs
      .map((slug) => this.getPost(slug))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
```

**GetPostNavigation** - Calculates previous/next post links:
```typescript
export class GetPostNavigationUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): PostNavigation {
    const allPosts = this.getSortedPosts();
    const currentIndex = allPosts.findIndex((post) => post.slug === slug);
    return {
      previous: currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null,
      next: currentIndex > 0 ? allPosts[currentIndex - 1] : null,
    };
  }
}
```

**GetAllTopics** - Extracts unique topics from all posts:
```typescript
export class GetAllTopicsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(): string[] {
    const allPosts = this.getAllPosts();
    const topics = new Set(allPosts.map((post) => post.topic));
    return Array.from(topics).sort();
  }
}
```

### Application Layer: Service

`PostService` composes all use cases and provides a unified API for the UI layer:

```typescript
export class PostService {
  private readonly getPostBySlug: GetPostBySlugUseCase;
  private readonly getAllPosts: GetAllPostsUseCase;
  private readonly getPostNavigation: GetPostNavigationUseCase;
  private readonly getAllTopics: GetAllTopicsUseCase;

  constructor(postRepository: IPostRepository) {
    this.getPostBySlug = new GetPostBySlugUseCase(postRepository);
    this.getAllPosts = new GetAllPostsUseCase(postRepository);
    this.getPostNavigation = new GetPostNavigationUseCase(postRepository);
    this.getAllTopics = new GetAllTopicsUseCase(postRepository);
  }

  findBySlug(slug: string): Post {
    return this.getPostBySlug.execute(slug);
  }

  listAll(): Post[] {
    return this.getAllPosts.execute();
  }

  getNavigation(slug: string): PostNavigation {
    return this.getPostNavigation.execute(slug);
  }

  listTopics(): string[] {
    return this.getAllTopics.execute();
  }
}
```

### Infrastructure Layer: DI Container

The `Container` class wires port interfaces to concrete implementations. It supports optional dependency overrides for testing:

```typescript
interface Dependencies {
  postRepository?: IPostRepository;
}

export class Container {
  constructor(private readonly deps?: Dependencies) {}

  getPostRepository(): IPostRepository {
    return this.deps?.postRepository ?? new FileSystemPostRepository();
  }

  getPostService(): PostService {
    return new PostService(this.getPostRepository());
  }
}
```

## Test Patterns

### Colocated Tests

Tests live alongside their source files with a `.test.ts` suffix. This makes it easy to find tests for any given module.

### InMemoryRepository as Test Double

All use case and service tests use `InMemoryPostRepository` instead of mocks:

```typescript
describe("GetPostBySlugUseCase", () => {
  let repository: InMemoryPostRepository;
  let useCase: GetPostBySlugUseCase;

  beforeEach(() => {
    repository = new InMemoryPostRepository();
    useCase = new GetPostBySlugUseCase(repository);
  });

  it("should return post when slug exists", () => {
    repository.addPost("my-post", { title: "My Post", date: new Date("2025-01-01"), topic: "engineer" }, "Content");

    const result = useCase.execute("my-post");

    expect(result.title).toBe("My Post");
  });
});
```

### One Behavior Per Test

Each `it` block tests exactly one behavior with a descriptive name:

```typescript
it("should return null for previous when viewing the oldest post", () => { ... });
it("should return null for next when viewing the newest post", () => { ... });
it("should return both previous and next for a middle post", () => { ... });
```

### Arrange-Act-Assert Structure

Tests follow a consistent three-phase structure with blank line separation.

## Import Flow

```
app/ → infrastructure/di → application/ → domain/
                ↓
       infrastructure/repositories/
```

The app layer only reaches infrastructure through the DI container. Use cases and services depend on domain port interfaces, not concrete adapters.
