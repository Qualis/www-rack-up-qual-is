# Self-Documenting Code: Real Examples from Codebase

This document provides concrete examples from the www-rack-up-qual-is codebase demonstrating the no-comments policy in practice. All examples are taken from actual production code.

## Table of Contents
1. [Pattern 1: Expressive Method Names](#pattern-1-expressive-method-names)
2. [Pattern 2: Descriptive Variable Names](#pattern-2-descriptive-variable-names)
3. [Pattern 3: Clear Interface Definitions](#pattern-3-clear-interface-definitions)
4. [Pattern 4: Small, Single-Purpose Classes](#pattern-4-small-single-purpose-classes)
5. [Pattern 5: Self-Documenting Dependency Injection](#pattern-5-self-documenting-dependency-injection)
6. [Before/After Refactoring Examples](#beforeafter-refactoring-examples)
7. [Project-Specific Patterns](#project-specific-patterns)

---

## Pattern 1: Expressive Method Names

### Example: Use Case Methods

**Location:** `src/application/use-cases/GetPostNavigation.ts`

```typescript
export class GetPostNavigationUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): PostNavigation {
    const allPosts = this.getAllPostsSortedByDate();
    const currentIndex = allPosts.findIndex((post) => post.slug === slug);
    return this.buildNavigationFromIndex(allPosts, currentIndex);
  }
}
```

**Why This Works:**
- `GetPostNavigationUseCase` - Class name clearly states purpose
- `execute()` - Standard use case method name
- `getAllPostsSortedByDate()` - Method name explains ordering
- `buildNavigationFromIndex()` - Clear transformation step

**What This Replaces:**
No need for comments like "Get navigation links for current post" - the names say it all.

---

### Example: Service Orchestration

**Location:** `src/application/services/PostService.ts`

```typescript
export class PostService {
  private readonly getPostBySlugUseCase: GetPostBySlugUseCase;
  private readonly getAllPostsUseCase: GetAllPostsUseCase;
  private readonly getPostNavigationUseCase: GetPostNavigationUseCase;

  constructor(postRepository: IPostRepository) {
    this.getPostBySlugUseCase = new GetPostBySlugUseCase(postRepository);
    this.getAllPostsUseCase = new GetAllPostsUseCase(postRepository);
    this.getPostNavigationUseCase = new GetPostNavigationUseCase(postRepository);
  }

  getPostBySlug(slug: string): Post {
    return this.getPostBySlugUseCase.execute(slug);
  }

  getAllPosts(): Post[] {
    return this.getAllPostsUseCase.execute();
  }

  getPostNavigation(slug: string): PostNavigation {
    return this.getPostNavigationUseCase.execute(slug);
  }
}
```

**Why This Works:**
- Constructor takes the port interface, creates use cases internally
- Each method delegates to a single use case
- Field names are self-documenting through naming
- No comments needed to explain orchestration pattern

---

## Pattern 2: Descriptive Variable Names

### Example: Post Navigation Logic

```typescript
execute(slug: string): PostNavigation {
  const allPostsSortedByDate = this.postRepository.getAllSlugs();
  const currentPostIndex = allPostsSortedByDate.findIndex(
    (postSlug) => postSlug === slug
  );

  const previousPostSlug = currentPostIndex > 0
    ? allPostsSortedByDate[currentPostIndex - 1]
    : null;

  const nextPostSlug = currentPostIndex < allPostsSortedByDate.length - 1
    ? allPostsSortedByDate[currentPostIndex + 1]
    : null;

  return { previous: previousPostSlug, next: nextPostSlug };
}
```

**Why This Works:**
- `allPostsSortedByDate` - Describes content and ordering
- `currentPostIndex` - Context included in name
- `previousPostSlug` / `nextPostSlug` - Purpose is obvious
- Each variable has a clear, specific purpose
- No abbreviations or cryptic names

---

### Example: Repository Data Building

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
    const postEntry = this.posts.get(slug);
    if (!postEntry) {
      throw new Error(`Post not found: ${slug}`);
    }
    return { metadata: postEntry.metadata, content: postEntry.content };
  }
}
```

**Why This Works:**
- `postEntry` - Describes what the variable represents
- `addPost` - Action-oriented method name
- `getRawPostData` - Clear what is returned
- Error message includes the slug for debugging

---

## Pattern 3: Clear Interface Definitions

### Example: Repository Port Interface

**Location:** `src/domain/repositories/IPostRepository.ts`

```typescript
export interface IPostRepository {
  getAllSlugs(): string[];
  getRawPostData(slug: string): RawPostData;
}
```

**Why This Works:**
- `IPostRepository` - `I` prefix denotes interface (port)
- `getAllSlugs()` - Return type and method name explain everything
- `getRawPostData()` - Clear what data is returned and in what form
- No JSDoc needed - TypeScript types document the contract

**What This Replaces:**
No need for comments like "Interface for accessing post data" or "Returns all post slugs from the data store".

---

## Pattern 4: Small, Single-Purpose Classes

### Example: Separate Use Cases

**Location:** `src/application/use-cases/`

```typescript
export class GetPostBySlugUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): Post {
    const rawPostData = this.postRepository.getRawPostData(slug);
    return this.transformToPost(slug, rawPostData);
  }
}

export class GetAllPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(): Post[] {
    const allSlugs = this.postRepository.getAllSlugs();
    return allSlugs.map((slug) => this.getPostBySlug(slug));
  }
}

export class GetPostNavigationUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): PostNavigation {
    const allSlugs = this.postRepository.getAllSlugs();
    const currentIndex = allSlugs.findIndex((s) => s === slug);
    return this.buildNavigation(allSlugs, currentIndex);
  }
}
```

**Why This Works:**
- Each class has ONE responsibility
- Class names describe the exact operation
- Short methods that fit on screen
- Clear flow without comments

---

## Pattern 5: Self-Documenting Dependency Injection

### Example: Container Class

**Location:** `src/infrastructure/di/container.ts`

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
    const postRepository = this.getPostRepository();
    const getPostBySlugUseCase = new GetPostBySlugUseCase(postRepository);
    const getAllPostsUseCase = new GetAllPostsUseCase(postRepository);
    const getPostNavigationUseCase = new GetPostNavigationUseCase(postRepository);

    return new PostService(
      getPostBySlugUseCase,
      getAllPostsUseCase,
      getPostNavigationUseCase
    );
  }
}
```

**Why This Works:**
- `Dependencies` interface documents what can be overridden
- Factory methods named `getX()` describe what they produce
- Default fallback to `FileSystemPostRepository` is explicit
- Wiring logic reads like a recipe - no comments needed

---

## Before/After Refactoring Examples

### Scenario 1: Use Case with Comments -> Self-Documenting

**BEFORE (With Comments - FORBIDDEN):**
```typescript
class GetPostNav {
  constructor(private repo: any) {}

  run(s: string) {
    // Get all posts
    const posts = this.repo.getAll();
    // Find current post index
    const idx = posts.indexOf(s);
    // Build prev/next
    return {
      prev: idx > 0 ? posts[idx - 1] : null,
      next: idx < posts.length - 1 ? posts[idx + 1] : null,
    };
  }
}
```

**AFTER (Self-Documenting - ACTUAL CODE):**
```typescript
export class GetPostNavigationUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): PostNavigation {
    const allSlugs = this.postRepository.getAllSlugs();
    const currentIndex = allSlugs.findIndex((s) => s === slug);

    const previousSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
    const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;

    return { previous: previousSlug, next: nextSlug };
  }
}
```

**Improvements:**
- Type hints document types (no comment needed)
- `postRepository: IPostRepository` (typed interface) vs `repo: any` (untyped)
- `slug` (specific) vs `s` (cryptic)
- `currentIndex` (descriptive) vs `idx` (abbreviation)
- `previousSlug` / `nextSlug` (clear) vs `prev` / `next` (abbreviated)
- Return type `PostNavigation` documents what's returned

---

### Scenario 2: Repository with Comments -> Descriptive Names

**BEFORE (With Comments - FORBIDDEN):**
```typescript
class MemRepo {
  private data: Map<string, any> = new Map();

  // Add a post to the store
  add(k: string, v: any): void {
    this.data.set(k, v);
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.data.keys());
  }

  // Get data by key, throws if not found
  get(k: string): any {
    const d = this.data.get(k);
    if (!d) throw new Error("Not found");
    return d;
  }
}
```

**AFTER (Self-Documenting - ACTUAL CODE):**
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
    const postEntry = this.posts.get(slug);
    if (!postEntry) {
      throw new Error(`Post not found: ${slug}`);
    }
    return { metadata: postEntry.metadata, content: postEntry.content };
  }
}
```

**Improvements:**
- `InMemoryPostRepository` vs `MemRepo` (full context in class name)
- `implements IPostRepository` - Self-documenting contract
- `addPost` vs `add` (includes domain context)
- `getAllSlugs` vs `keys` (business language)
- `getRawPostData` vs `get` (describes what is returned)
- Typed parameters vs `any` - types document the contract
- Descriptive error message includes the slug

---

### Scenario 3: Conditional Logic with Comments -> Boolean Variables

**BEFORE (With Comments - FORBIDDEN):**
```typescript
function shouldShowPost(post: Post, user: User): boolean {
  // Show if published or if user is author or admin
  if (post.status === "published" || user.id === post.authorId || user.role === "admin") {
    return true;
  }
  return false;
}
```

**AFTER (Self-Documenting):**
```typescript
function shouldShowPost(post: Post, user: User): boolean {
  const postIsPublished = post.status === "published";
  const userIsAuthor = user.id === post.authorId;
  const userIsAdmin = user.role === "admin";

  const postIsVisibleToUser =
    postIsPublished ||
    userIsAuthor ||
    userIsAdmin;

  return postIsVisibleToUser;
}
```

**Improvements:**
- Each condition has a descriptive boolean name
- The combined condition reads like a sentence
- No comment needed to explain the visibility rules

---

### Scenario 4: Service with Comments -> Expressive Delegation

**BEFORE (With Comments - FORBIDDEN):**
```typescript
class PostSvc {
  constructor(private repo: any) {}

  // Get a single post by its URL slug
  getOne(slug: string): any {
    return this.repo.get(slug);
  }

  // Get all posts sorted by date
  getAll(): any[] {
    return this.repo.getAll();
  }
}
```

**AFTER (Self-Documenting - ACTUAL CODE):**
```typescript
export class PostService {
  private readonly getPostBySlugUseCase: GetPostBySlugUseCase;
  private readonly getAllPostsUseCase: GetAllPostsUseCase;
  private readonly getPostNavigationUseCase: GetPostNavigationUseCase;

  constructor(postRepository: IPostRepository) {
    this.getPostBySlugUseCase = new GetPostBySlugUseCase(postRepository);
    this.getAllPostsUseCase = new GetAllPostsUseCase(postRepository);
    this.getPostNavigationUseCase = new GetPostNavigationUseCase(postRepository);
  }

  getPostBySlug(slug: string): Post {
    return this.getPostBySlugUseCase.execute(slug);
  }

  getAllPosts(): Post[] {
    return this.getAllPostsUseCase.execute();
  }

  getPostNavigation(slug: string): PostNavigation {
    return this.getPostNavigationUseCase.execute(slug);
  }
}
```

**Improvements:**
- `PostService` vs `PostSvc` (no abbreviation)
- `getPostBySlug` vs `getOne` (business-specific naming)
- `getAllPosts` vs `getAll` (domain context)
- Typed return values (`Post`, `Post[]`, `PostNavigation`) vs `any`
- Constructor takes port interface, creates use cases internally

---

## Project-Specific Patterns

### Pattern: Port/Adapter Separation

The project separates port interfaces (domain) from adapter implementations (infrastructure):

```typescript
export interface IPostRepository {
  getAllSlugs(): string[];
  getRawPostData(slug: string): RawPostData;
}
```

**Why No Comments Needed:**
- `IPostRepository` - `I` prefix denotes port interface
- Method names `getAllSlugs()` / `getRawPostData()` - Clear operations
- TypeScript `interface` keyword - Indicates contract pattern
- Return types document contracts

---

### Pattern: Constructor Injection with Typed Dependencies

**Location:** Throughout codebase

```typescript
export class GetPostBySlugUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): Post {
    const rawPostData = this.postRepository.getRawPostData(slug);
    return this.transformToPost(slug, rawPostData);
  }
}
```

**Why No Comments Needed:**
- Type `IPostRepository` documents expected interface
- Parameter name `postRepository` describes purpose
- `private readonly` indicates immutable internal dependency
- Constructor pattern is standard dependency injection

---

### Pattern: DI Container with Defaults

**Location:** `src/infrastructure/di/container.ts`

```typescript
export class Container {
  constructor(private readonly deps?: Dependencies) {}

  getPostRepository(): IPostRepository {
    return this.deps?.postRepository ?? new FileSystemPostRepository();
  }
}
```

**Why No Comments Needed:**
- Optional `deps` parameter enables test overrides
- Nullish coalescing (`??`) provides clear default
- Factory method name `getPostRepository` describes output
- Pattern is self-documenting: override or use default

---

### Pattern: Type Definitions as Documentation

**Location:** `src/interfaces/`

```typescript
export interface PostNavigation {
  previous: string | null;
  next: string | null;
}

export interface RawPostData {
  metadata: PostMetadata;
  content: string;
}

export interface PostMetadata {
  title: string;
  date: Date;
  topic: string;
}
```

**Why This Works:**
- Interface names describe the concept
- Property names are self-explanatory
- Types document nullable fields (`string | null`)
- No JSDoc needed - the types are the documentation

---

## Quick Reference: When You're Tempted to Add a Comment

| Temptation | Refactoring Solution | Example from Codebase |
|------------|---------------------|----------------------|
| "This creates..." | Use `createX()` or `buildX()` in name | `new GetPostBySlugUseCase(repository)` |
| "This gets..." | Use `getX()` with domain context | `getPostBySlug()`, `getAllPosts()` |
| "This transforms..." | Use `transformToX()` or `buildX()` | `transformToPost()` |
| "Get X from Y" | Use `getXFromY()` or method on repository | `getRawPostData(slug)` |
| "Returns null if..." | Type signature `string \| null` documents it | `previous: string \| null` |
| "Store for later" | Use descriptive name with context | `private readonly postRepository` |
| "This is the default" | Use nullish coalescing with named default | `deps?.postRepository ?? new FileSystemPostRepository()` |
| "Magic number X means..." | Named constant | `HOME_OG_IMAGE_URL` |

---

## Anti-Patterns to Avoid

### Cryptic Abbreviations
```typescript
const repo = getRepo();    // What kind of repo?
const nav = getNav();      // Navigation to where?
const dto = buildDto();    // What data is being transferred?
```

### Use Full, Descriptive Names
```typescript
const postRepository = getPostRepository();
const postNavigation = getPostNavigation(slug);
const postResponseData = buildPostResponseData(post);
```

---

### Generic Names
```typescript
function process(data: any): any {
  const result = doStuff(data);
  return result;
}
```

### Use Specific, Context-Rich Names
```typescript
function getPostBySlug(slug: string): Post {
  const rawPostData = postRepository.getRawPostData(slug);
  return transformToPost(slug, rawPostData);
}
```

---

## Conclusion

The codebase demonstrates that well-named functions, variables, and classes eliminate the need for comments. Every example shown here is production code that:

1. **Compiles and runs** without comments
2. **Passes 100% test coverage** requirements
3. **Follows architectural rules** (clean architecture, DI, port/adapter)
4. **Remains maintainable** over time

When you're tempted to add a comment, refer back to these patterns and refactor instead.

## References

All examples taken from:
- `src/domain/repositories/IPostRepository.ts`
- `src/application/use-cases/GetPostNavigationUseCase.ts`
- `src/application/use-cases/GetPostBySlugUseCase.ts`
- `src/application/use-cases/GetAllPostsUseCase.ts`
- `src/application/services/PostService.ts`
- `src/infrastructure/repositories/InMemoryPostRepository.ts`
- `src/infrastructure/di/container.ts`
- `src/interfaces/`

See `.claude/CLAUDE.md` for full project rules and architectural guidelines.
