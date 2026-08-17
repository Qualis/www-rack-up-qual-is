---
name: Hexagonal Architecture Feature Scaffolder
description: This skill should be used when the user asks to "create a new feature", "scaffold a feature", "add a new domain entity", "create a new use case", "add a new resource", or "implement a new use case". This skill guides Claude through creating features following the project's hexagonal architecture with proper layer separation in a TypeScript/Next.js project.
version: 2.0.0
---

# Hexagonal Architecture Feature Scaffolder

## Overview

This skill guides you through scaffolding complete features across all layers of the hexagonal architecture used in this TypeScript/Next.js project. It ensures proper layer separation, dependency injection, and adherence to project standards.

## When to Use This Skill

Use this skill when implementing any new feature that requires:
- New domain port interfaces
- New use cases or workflows
- New repository implementations
- New application services
- Complete vertical slices through the architecture

## Architecture Layers

The project follows hexagonal architecture with these layers:

1. **Domain Layer** (`src/domain/`) - Port interfaces and pure business rules
2. **Application Layer** (`src/application/`) - Use cases and service orchestration
3. **Infrastructure Layer** (`src/infrastructure/`) - Adapter implementations and DI container
4. **App/UI Layer** (`src/app/`) - Next.js pages and components
5. **Interfaces Layer** (`src/interfaces/`) - Shared TypeScript type definitions
6. **Lib Layer** (`src/lib/`) - Pure utility functions

## Step-by-Step Scaffolding Process

### Step 1: Create Domain Port Interface

**Location:** `src/domain/repositories/I{FeatureName}Repository.ts`

Define the repository port interface:

```typescript
import { FeatureData } from "@/interfaces/FeatureData";

export interface IFeatureRepository {
  getAllSlugs(): string[];
  getBySlug(slug: string): FeatureData;
}
```

**Rules:**
- Use TypeScript `interface` for port definitions
- Keep pure abstractions only
- No imports from application, infrastructure, or app layers
- No external framework dependencies

**Reference:** See `src/domain/repositories/IPostRepository.ts` for the existing pattern.

### Step 2: Create InMemory Implementation

**Location:** `src/infrastructure/repositories/InMemory{FeatureName}Repository.ts`

Create a test-friendly in-memory implementation:

```typescript
import { IFeatureRepository } from "@/domain/repositories/IFeatureRepository";
import { FeatureData } from "@/interfaces/FeatureData";

export class InMemoryFeatureRepository implements IFeatureRepository {
  private readonly features: Map<string, FeatureData> = new Map();

  addFeature(slug: string, data: FeatureData): void {
    this.features.set(slug, data);
  }

  getAllSlugs(): string[] {
    return Array.from(this.features.keys());
  }

  getBySlug(slug: string): FeatureData {
    const feature = this.features.get(slug);
    if (!feature) {
      throw new Error(`Feature with slug "${slug}" not found`);
    }
    return feature;
  }
}
```

**Rules:**
- Implements the domain port interface
- Provides helper methods like `addFeature()` for test setup
- Used in all unit tests as the test double

**Reference:** See `src/infrastructure/repositories/InMemoryPostRepository.ts` for the existing pattern.

### Step 3: Create FileSystem/Real Implementation

**Location:** `src/infrastructure/repositories/FileSystem{FeatureName}Repository.ts`

Create the production implementation:

```typescript
import { IFeatureRepository } from "@/domain/repositories/IFeatureRepository";
import { FeatureData } from "@/interfaces/FeatureData";
import fs from "fs";
import path from "path";

export class FileSystemFeatureRepository implements IFeatureRepository {
  private readonly contentDirectory: string;

  constructor(contentDirectory: string = path.join(process.cwd(), "content/features")) {
    this.contentDirectory = contentDirectory;
  }

  getAllSlugs(): string[] {
    return fs.readdirSync(this.contentDirectory)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
  }

  getBySlug(slug: string): FeatureData {
    const filePath = path.join(this.contentDirectory, `${slug}.md`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return this.parseContent(fileContent);
  }

  private parseContent(content: string): FeatureData {
    return this.extractFeatureData(content);
  }
}
```

**Rules:**
- Implements the same domain port interface
- Handles all I/O and external integrations
- May import from domain and application layers

**Reference:** See `src/infrastructure/repositories/FileSystemPostRepository.ts` for the existing pattern.

### Step 4: Create Use Cases

**Location:** `src/application/use-cases/GetFeatureBySlug.ts` (one file per use case)

Create focused, single-purpose use case classes:

```typescript
import { IFeatureRepository } from "@/domain/repositories/IFeatureRepository";
import { FeatureData } from "@/interfaces/FeatureData";

export class GetFeatureBySlugUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  execute(slug: string): FeatureData {
    return this.featureRepository.getBySlug(slug);
  }
}
```

```typescript
import { IFeatureRepository } from "@/domain/repositories/IFeatureRepository";

export class GetAllFeaturesUseCase {
  constructor(private readonly featureRepository: IFeatureRepository) {}

  execute(): string[] {
    return this.featureRepository.getAllSlugs();
  }
}
```

**Rules:**
- One use case class per file
- Use constructor injection for dependencies
- Depend on port interfaces, not implementations
- No direct infrastructure or framework dependencies

**Reference:** See `src/application/use-cases/GetPostBySlug.ts`, `GetAllPosts.ts`, `GetPostNavigation.ts`, and `GetAllTopics.ts` for existing patterns.

### Step 5: Create Service Method

**Location:** Edit `src/application/services/{FeatureName}Service.ts` or create if needed

Create an application service that orchestrates use cases:

```typescript
import { IFeatureRepository } from "@/domain/repositories/IFeatureRepository";
import { GetFeatureBySlugUseCase } from "@/application/use-cases/GetFeatureBySlug";
import { GetAllFeaturesUseCase } from "@/application/use-cases/GetAllFeatures";
import { FeatureData } from "@/interfaces/FeatureData";

export class FeatureService {
  private readonly getFeatureBySlug: GetFeatureBySlugUseCase;
  private readonly getAllFeatures: GetAllFeaturesUseCase;

  constructor(featureRepository: IFeatureRepository) {
    this.getFeatureBySlug = new GetFeatureBySlugUseCase(featureRepository);
    this.getAllFeatures = new GetAllFeaturesUseCase(featureRepository);
  }

  findBySlug(slug: string): FeatureData {
    return this.getFeatureBySlug.execute(slug);
  }

  listAll(): string[] {
    return this.getAllFeatures.execute();
  }
}
```

**Rules:**
- Composes use cases and delegates to them
- Receives repository via constructor, creates use cases internally
- Provides a clean API for the UI layer to consume

**Reference:** See `src/application/services/PostService.ts` for the existing pattern.

### Step 6: Update DI Container

**Location:** Edit `src/infrastructure/di/container.ts`

Register the new feature in the existing Container class:

```typescript
import { IFeatureRepository } from "@/domain/repositories/IFeatureRepository";
import { FileSystemFeatureRepository } from "@/infrastructure/repositories/FileSystemFeatureRepository";
import { FeatureService } from "@/application/services/FeatureService";

interface Dependencies {
  postRepository?: IPostRepository;
  featureRepository?: IFeatureRepository;
}

export class Container {
  constructor(private readonly deps?: Dependencies) {}

  getFeatureRepository(): IFeatureRepository {
    return this.deps?.featureRepository ?? new FileSystemFeatureRepository();
  }

  getFeatureService(): FeatureService {
    return new FeatureService(this.getFeatureRepository());
  }
}
```

**Rules:**
- Add a getter for the repository and service
- Support optional dependency override for testing
- Default to production implementation (FileSystem)
- The container is the only infrastructure import allowed from the app layer

**Reference:** See the existing `src/infrastructure/di/container.ts` for the pattern with `getPostRepository()` and `getPostService()`.

### Step 7: Create Colocated Test Files

For each source file created, create a colocated test file with `.test.ts` suffix:

- `src/domain/repositories/IFeatureRepository.test.ts`
- `src/infrastructure/repositories/InMemoryFeatureRepository.test.ts`
- `src/infrastructure/repositories/FileSystemFeatureRepository.test.ts`
- `src/application/use-cases/GetFeatureBySlug.test.ts`
- `src/application/use-cases/GetAllFeatures.test.ts`
- `src/application/services/FeatureService.test.ts`
- `src/infrastructure/di/container.test.ts` (update existing)

**Test example using InMemoryRepository as test double:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { GetFeatureBySlugUseCase } from "./GetFeatureBySlug";
import { InMemoryFeatureRepository } from "@/infrastructure/repositories/InMemoryFeatureRepository";

describe("GetFeatureBySlugUseCase", () => {
  let repository: InMemoryFeatureRepository;
  let useCase: GetFeatureBySlugUseCase;

  beforeEach(() => {
    repository = new InMemoryFeatureRepository();
    useCase = new GetFeatureBySlugUseCase(repository);
  });

  it("should return feature data when slug exists", () => {
    repository.addFeature("my-feature", { title: "My Feature", content: "Hello" });

    const result = useCase.execute("my-feature");

    expect(result.title).toBe("My Feature");
  });

  it("should throw error when slug does not exist", () => {
    expect(() => useCase.execute("nonexistent")).toThrow();
  });
});
```

**Rules:**
- Tests are colocated with source files (same directory, `.test.ts` suffix)
- Use Vitest (`describe`/`it`/`expect`)
- Each `it` block tests one behavior
- Test names follow `should ... when ...` pattern
- Use `InMemoryRepository` as the test double, not mocks
- Arrange-Act-Assert structure

## Critical Rules to Follow

1. **NO COMMENTS** - Code must be self-documenting through expressive naming
2. **Layer Boundaries** - Respect import restrictions:
   - Domain CANNOT import from application, infrastructure, or app
   - Application CANNOT import from infrastructure or app
   - Lib CANNOT import from any layer
   - App SHOULD NOT import infrastructure (except `infrastructure/di`)
3. **Dependency Injection** - Always use constructor injection, depend on interfaces
4. **One Behavior Per Test** - Each `it` block tests one focused behavior
5. **100% Test Coverage** - Every function must have tests
6. **TypeScript Strict Mode** - Type all function signatures

## Verification Checklist

After scaffolding, verify:

- [ ] All files created in correct layer directories
- [ ] No layer boundary violations (`npm run test:architecture`)
- [ ] Port interface in domain, implementations in infrastructure
- [ ] Use cases use constructor injection with port interfaces
- [ ] Service orchestrates use cases
- [ ] DI container updated with new feature
- [ ] Colocated tests created for all components
- [ ] Tests use InMemoryRepository as test double
- [ ] Tests follow one-behavior-per-test rule
- [ ] All tests pass: `npm run test:all`
- [ ] Code formatted: `npm run format`
- [ ] 100% coverage: `npm run test:coverage`

## References

See the `references/` directory for:
- Existing Post feature as reference implementation
- Layer dependency rules enforced by dependency-cruiser

## Common Mistakes to Avoid

1. **Direct instantiation in use cases** - Always use DI, depend on interfaces
2. **Domain importing infrastructure** - Keep domain pure
3. **Business logic in pages/components** - Logic belongs in domain/application
4. **Importing infrastructure in app** - Use the DI container only
5. **Creating mocks instead of using InMemoryRepository** - Prefer test doubles
6. **Skipping architecture tests** - Run `npm run test:architecture`
7. **Adding comments** - Refactor to self-documenting code instead
8. **Tests not colocated** - Place `.test.ts` files next to source files
