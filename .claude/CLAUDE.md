# www-rack-up-qual-is - Claude Code Instructions

## Absolute Non-Negotiables

These rules are **MANDATORY** and violations will break the project:

### 1. NO COMMENTS
- Code MUST be self-documenting through expressive naming
- NEVER add comments to any code
- If code needs explanation, refactor it to be clearer instead

### 2. ONE BEHAVIOR PER TEST
- Each test (`it()` block) should test ONE behavior or concept
- Use descriptive `it("should ... when ...")` names
- Prefer focused tests; multiple `expect()` calls are acceptable when verifying aspects of the same behavior
- **Example:**
  ```typescript
  // WRONG - Vague, tests multiple unrelated behaviors
  it("works", () => {
    const result = useCase.execute("slug");
    expect(result.previous).toBeNull();
    expect(result.next).not.toBeNull();
    expect(otherUseCase.execute()).toHaveLength(3);
  });

  // CORRECT - Focused on one behavior
  it("should return null for previous when viewing the oldest post", () => {
    repository.addPost("post-1", { title: "Post 1", date: new Date("2025-01-01"), topic: "engineer" }, "Content 1");
    repository.addPost("post-2", { title: "Post 2", date: new Date("2025-01-15"), topic: "lead" }, "Content 2");

    const result = useCase.execute("post-1");

    expect(result.previous).toBeNull();
  });
  ```

### 3. LAYER BOUNDARY VIOLATIONS FORBIDDEN
- **Domain** (`src/domain/`) MUST NOT import from: `application`, `infrastructure`, `app`
- **Application** (`src/application/`) MUST NOT import from: `infrastructure`, `app`
- **Lib** (`src/lib/`) MUST NOT import from: `domain`, `application`, `infrastructure`, `app`
- **App/UI** (`src/app/`) SHOULD NOT import from `infrastructure` (except `infrastructure/di`)
- **No circular dependencies** between modules
- Enforced automatically by **dependency-cruiser** (`npm run test:architecture`)

### 4. 100% TEST COVERAGE REQUIRED
- Every function, class, and method MUST have tests
- Tests MUST be meaningful, not just coverage-seeking
- Use `npm run test:coverage` to verify coverage
- Coverage thresholds: 100% for lines, functions, branches, and statements

### 5. PREFER EDITING OVER CREATING
- ALWAYS prefer editing existing files to creating new ones
- Only create new files when absolutely necessary
- Do NOT create documentation files unless explicitly requested

## Architectural Layer Rules

### Project Structure Overview

```
src/
├── domain/                    # Core business rules (innermost layer)
│   └── repositories/          # Port interfaces (e.g., IPostRepository.ts)
├── application/               # Application business rules
│   ├── use-cases/             # Single-purpose operations (e.g., GetPostBySlug.ts)
│   └── services/              # Orchestration of use cases (e.g., PostService.ts)
├── infrastructure/            # Framework & external dependencies (outermost layer)
│   ├── repositories/          # Adapter implementations (FileSystem, InMemory)
│   └── di/                    # Dependency injection container
├── app/                       # Interface adapters (Next.js App Router)
│   ├── _components/           # React components
│   ├── posts/                 # Post pages
│   ├── about/                 # About page
│   ├── blog/                  # Blog listing
│   └── layout.tsx             # Root layout
├── interfaces/                # TypeScript type definitions
└── lib/                       # Utility functions and helpers
```

### Domain Layer (`src/domain/`)

**Purpose:** Pure business rules and port interfaces

**Rules:**
- Define repository interfaces using TypeScript `interface` or `abstract class`
- Contains only domain concepts and abstractions
- MUST NOT depend on external frameworks (Next.js, databases, etc.)
- MUST NOT have side effects (no I/O, no external calls)

**Structure:**
- `repositories/` - Port interfaces (e.g., `IPostRepository`)

### Application Layer (`src/application/`)

**Purpose:** Orchestrate use cases and coordinate domain logic

**Rules:**
- Use cases orchestrate and delegate to domain services
- MUST NOT depend on infrastructure or UI frameworks directly
- Use constructor injection to receive dependencies
- Focus on workflow orchestration, not business logic

**Structure:**
- `use-cases/` - Single-purpose operations (e.g., `GetPostBySlug`, `GetAllPosts`)
- `services/` - Application services coordinating use cases (e.g., `PostService`)

**Example Use Case Pattern:**
```typescript
import { IPostRepository } from "@/domain/repositories/IPostRepository";

export class GetPostNavigationUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): PostNavigation {
    const allPosts = this.getAllPosts();
    const currentIndex = allPosts.findIndex((post) => post.slug === slug);
    return this.buildNavigation(allPosts, currentIndex);
  }
}
```

### Infrastructure Layer (`src/infrastructure/`)

**Purpose:** Implement technical adapters and integrations

**Rules:**
- Implement repository interfaces from `domain/repositories`
- Handle all external integrations (file system, databases, APIs)
- Provide concrete implementations of domain abstractions
- Manage dependency injection container

**Structure:**
- `repositories/` - Concrete implementations (e.g., `FileSystemPostRepository`, `InMemoryPostRepository`)
- `di/` - Dependency injection container (`container.ts`)

### Interface/UI Layer (`src/app/`)

**Purpose:** User interface and external communication (Next.js App Router)

**Rules:**
- Server components and pages
- React components for UI presentation
- Depends on application layer via DI container
- SHOULD NOT import infrastructure directly (except `infrastructure/di`)

### Lib Layer (`src/lib/`)

**Purpose:** Pure utility functions and helpers

**Rules:**
- MUST be independent of all architectural layers
- Contains reusable utilities (transformers, markdown processing, constants)
- No domain, application, infrastructure, or UI imports

### Interfaces Layer (`src/interfaces/`)

**Purpose:** TypeScript type definitions shared across layers

**Rules:**
- Contains type/interface definitions (e.g., `Post`, `PostNavigation`)
- May be imported by any layer
- No logic, only types

## Testing Requirements

### Test Framework and Tools

- **Vitest** for unit testing
- **Playwright** for E2E testing
- **dependency-cruiser** for architecture enforcement
- Tests are **colocated** with source files (`.test.ts` suffix)

### Test Naming Convention

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

### Test Structure: Arrange-Act-Assert

```typescript
it("should return empty array when no posts exist", () => {
  // Arrange
  const repository = new InMemoryPostRepository();

  // Act
  const slugs = repository.getAllSlugs();

  // Assert
  expect(slugs).toEqual([]);
});
```

### Mocking and Test Isolation

- Use `InMemoryPostRepository` for use case and service tests (prefer test doubles over mocks)
- Use `vi.mock()` for module mocking when needed
- Use `vi.spyOn()` for function spying
- Inject test doubles via constructor or DI container
- Keep tests fast and independent using `beforeEach` for fresh setup

### Architectural Testing

Layer boundaries are enforced automatically via dependency-cruiser:

```bash
npm run test:architecture
```

This validates:
- Domain layer has no outward dependencies
- Application layer only depends on domain, interfaces, and lib
- No circular dependencies exist
- Lib is independent of all layers

## Dependency Injection

**Use constructor injection** - depend on interfaces, not implementations.

### Pattern

```typescript
// Define interface in domain
export interface IPostRepository {
  getAllSlugs(): string[];
  getRawPostData(slug: string): RawPostData;
}

// Implement in infrastructure
export class FileSystemPostRepository implements IPostRepository {
  getAllSlugs(): string[] { /* ... */ }
  getRawPostData(slug: string): RawPostData { /* ... */ }
}

// InMemory implementation for testing
export class InMemoryPostRepository implements IPostRepository {
  getAllSlugs(): string[] { /* ... */ }
  getRawPostData(slug: string): RawPostData { /* ... */ }
}

// Container wires interface to implementation
export class Container {
  constructor(private readonly deps?: Dependencies) {}

  getPostRepository(): IPostRepository {
    return this.deps?.postRepository ?? new FileSystemPostRepository();
  }
}
```

## Code Quality Standards

### Static Analysis Tools

Before completing any work, code MUST pass:

| Tool | Purpose | Command |
|------|---------|---------|
| Prettier | Code formatting | `npm run lint` / `npm run format` |
| ESLint | Linting and security | `npm run lint:eslint` |
| TypeScript | Type checking | `npm run type-check` |
| dependency-cruiser | Architecture boundaries | `npm run test:architecture` |
| npm audit | Dependency vulnerabilities | `npm audit` |

### Naming Conventions

- Use descriptive names that communicate intent
- Classes: `PascalCase` (e.g., `GetPostBySlugUseCase`)
- Functions/variables: `camelCase` (e.g., `getAllPosts`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `HOME_OG_IMAGE_URL`)
- Interfaces: `PascalCase` with `I` prefix for ports (e.g., `IPostRepository`)
- Types: `PascalCase` (e.g., `PostNavigation`, `RawPostData`)
- Files: `PascalCase` for classes/components, `camelCase` for utilities

### TypeScript

- Use TypeScript strict mode
- Type all function signatures
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `readonly` for immutable properties

## Development Workflow

### Before Starting Work
1. Understand the architectural layer you're working in
2. Identify existing files to edit rather than creating new ones
3. Plan your tests before implementation

### During Development
1. Write tests first (TDD approach encouraged)
2. Each test focused on one behavior
3. Use dependency injection (constructor injection, DI container)
4. Ensure no comments - make code self-documenting

### Before Completing Work
1. Run `npm run test:all` to verify everything passes
2. Run `npm run format` to format code with Prettier
3. Verify all quality checks pass (`npm run quality`)
4. Review for layer boundary violations (`npm run test:architecture`)
5. Confirm 100% test coverage (`npm run test:coverage`)

### Running Tests

**IMPORTANT: Always use `npm run test:all` for final verification**

```bash
# Full verification (audit, quality, architecture, unit, E2E)
npm run test:all

# Quality checks (Prettier + TypeScript)
npm run quality

# Unit tests with coverage
npm run test:coverage

# Unit tests in watch mode (during TDD)
npm test

# Run specific test file
npx vitest run src/path/to/file.test.ts

# Architecture boundary tests
npm run test:architecture

# E2E tests
npm run test:e2e

# Format code
npm run format
```

Running only `npx vitest` bypasses quality gates (Prettier, ESLint, TypeScript, architecture checks, npm audit). Use `npm run test:all` for complete verification.

## When Uncertain

### ASK rather than guess when:
- Unclear which layer should contain logic
- Uncertain about dependency direction
- Need clarification on requirements
- Unsure if creating a new file is necessary

### DO NOT:
- Create files without necessity
- Add comments to explain unclear code (refactor instead)
- Violate layer boundaries "just this once"
- Skip running quality checks before completion

## Common Pitfalls to Avoid

1. **Importing infrastructure in domain** - Domain must be pure
2. **Adding comments** - Make code self-documenting instead
3. **Direct instantiation in use cases** - Use dependency injection
4. **Importing infrastructure in app** - Use DI container (`infrastructure/di`)
5. **Wrong test names** - Follow descriptive sentence pattern
6. **Creating circular dependencies** - dependency-cruiser will catch these
7. **Lib importing from layers** - Lib must be independent
8. **Skipping architecture tests** - Run `npm run test:architecture`
9. **Using vitest directly for final verification** - Use `npm run test:all`
10. **Creating new files unnecessarily** - Prefer editing existing

## Success Criteria

Work is complete when:
- [ ] All tests pass with 100% coverage (`npm run test:coverage`)
- [ ] All quality checks pass (`npm run quality`)
- [ ] Architecture boundaries validated (`npm run test:architecture`)
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Test names follow descriptive sentence pattern
- [ ] No comments exist in code
- [ ] Layer boundaries are respected
- [ ] Dependency injection is used throughout
- [ ] No secrets are committed
