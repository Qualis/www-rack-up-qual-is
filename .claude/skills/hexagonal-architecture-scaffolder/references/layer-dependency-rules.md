# Layer Dependency Rules

## Allowed Import Directions

```
┌─────────────┐
│ interfaces/ │ ← Type definitions, can be imported by ANY layer
├─────────────┤
│    lib/     │ ← Pure utilities, can be imported by ANY layer
└─────────────┘   CANNOT import from: domain, application, infrastructure, app

┌─────────────┐
│   domain/   │ ← NO outward imports (pure business rules and port interfaces)
└─────────────┘   Can import: interfaces, lib
       ↑
       │
┌─────────────┐
│ application/ │ ← Can import: domain, interfaces, lib
└─────────────┘   CANNOT import: infrastructure, app
       ↑
       │
┌──────────────────────────┐
│ infrastructure/ │  app/  │ ← Can import: domain, application, interfaces, lib
└──────────────────────────┘   app/ may only import infrastructure/di
```

## Specific Rules

### Domain Layer (`src/domain/`)
**CAN import:**
- `src/interfaces/` (shared type definitions)
- `src/lib/` (pure utilities)

**CANNOT import:**
- `src/application/`
- `src/infrastructure/`
- `src/app/`
- Next.js framework modules
- Node.js I/O modules (fs, path, etc.)

**Why:** Domain contains port interfaces and pure business rules. It must remain free from framework coupling and side effects.

### Application Layer (`src/application/`)
**CAN import:**
- `src/domain/` (port interfaces)
- `src/interfaces/` (shared type definitions)
- `src/lib/` (pure utilities)

**CANNOT import:**
- `src/infrastructure/`
- `src/app/`
- Next.js framework modules
- Node.js I/O modules directly

**Why:** Use cases and services orchestrate domain logic through port interfaces without depending on concrete implementations.

### Infrastructure Layer (`src/infrastructure/`)
**CAN import:**
- `src/domain/` (implements port interfaces)
- `src/application/` (creates services and use cases in DI container)
- `src/interfaces/` (shared type definitions)
- `src/lib/` (pure utilities)
- External libraries (fs, databases, APIs, etc.)

**CANNOT import:**
- `src/app/` (not a dependency)

**Why:** Infrastructure provides concrete adapter implementations of domain port interfaces and wires everything together in the DI container.

### App/UI Layer (`src/app/`)
**CAN import:**
- `src/application/` (services)
- `src/domain/` (port interfaces)
- `src/interfaces/` (shared type definitions)
- `src/lib/` (pure utilities)
- `src/infrastructure/di/` (DI container only)
- Next.js framework modules

**CANNOT import:**
- `src/infrastructure/repositories/` (use DI container instead)
- `src/infrastructure/` directly (except `di/`)

**Why:** The app layer accesses infrastructure only through the DI container, maintaining the inversion of control.

### Lib Layer (`src/lib/`)
**CAN import:**
- Standard library utilities
- Third-party utility packages

**CANNOT import:**
- `src/domain/`
- `src/application/`
- `src/infrastructure/`
- `src/app/`

**Why:** Lib is a cross-cutting utility layer and must not depend on any architectural layer.

### Interfaces Layer (`src/interfaces/`)
**CAN import:**
- Other type definitions

**CANNOT import:**
- Any architectural layer (no runtime dependencies)

**Why:** Contains only TypeScript type definitions shared across all layers.

## No Circular Dependencies

Circular dependencies between any modules are forbidden. dependency-cruiser will detect and flag these automatically.

## Enforcement

These rules are enforced automatically by **dependency-cruiser** with rules defined in `.dependency-cruiser.js`.

Run architecture boundary tests:
```bash
npm run test:architecture
```

This validates:
- Domain layer has no outward dependencies
- Application layer only depends on domain, interfaces, and lib
- Lib is independent of all architectural layers
- No circular dependencies exist
- App does not import infrastructure directly (except di)

## Dependency Injection Pattern

To respect layer boundaries while wiring up dependencies:

1. **Define port interface in domain** (e.g., `IPostRepository` in `src/domain/repositories/`)
2. **Implement in infrastructure** (e.g., `FileSystemPostRepository`, `InMemoryPostRepository`)
3. **Use cases depend on port interface** (inject `IPostRepository`, not implementation)
4. **DI container maps interface to implementation** (in `src/infrastructure/di/container.ts`)
5. **App layer resolves via container** (e.g., `container.getPostService()`)

This allows swapping implementations without affecting domain or application layers.

## Common Violations to Avoid

1. **Domain importing infrastructure**: Port interfaces define the contract; infrastructure implements it
2. **Application importing infrastructure**: Use cases depend on port interfaces, not adapters
3. **App importing repositories directly**: Always go through the DI container
4. **Lib importing domain types**: Lib must remain independent of business concepts
5. **Circular imports between use cases**: Each use case should be self-contained
