# RackUp

A single-user home strength trainer. It renders a Push/Pull/Legs program,
lets you check off sets as you complete them, and runs a rest timer that
beeps when it finishes. Everything is stored in the browser — no backend,
no accounts, no network calls.

[![Service](https://github.com/Qualis/www-rack-up-qual-is/actions/workflows/service.yml/badge.svg)](https://github.com/Qualis/www-rack-up-qual-is/actions/workflows/service.yml)

## Features

- The full program rendered from `src/data/program.json`, including the
  optional fourth day, each day's warm-up block, inline exercise
  illustrations and external demo links
- One checkbox per set, with per-exercise and per-day progress
- Reps and weight are adjustable: the programme values are defaults, and
  anything you change is stored and becomes the default next time
- Checking a set off starts that exercise's rest timer; a new timer
  replaces any running one, so only one is ever active, and it keeps
  running while you browse other days
- The countdown is derived from a stored deadline rather than counted in
  ticks, so a backgrounded tab stays accurate instead of drifting
- At zero it plays a two-tone Web Audio beep, vibrates where supported,
  and clears itself — there is nothing to dismiss
- Progress persists in localStorage and survives a reload
- Built with Next.js 15 and React 19, Tailwind CSS, dark/light themes
- Unit + E2E testing at 100% coverage
- Automated architectural boundary enforcement

## The program

`src/data/program.json` is the single source of truth and is loaded
through `IProgramRepository`; no exercise data is hardcoded in a
component. Each day carries a `warmup` block and an `exercises` array,
and each exercise carries `sets`, `reps`, `restSeconds`, `weight`, a
`demoUrl` linking out to MuscleWiki, and an `illustrationSvg` rendered
inline. Edit that file to change the program.

## Stored state

One versioned localStorage key, `rackup-workout-state`:

```json
{
  "version": 2,
  "days": {
    "1": {
      "lastActiveDate": "2026-08-16",
      "completedSets": { "bench": [0, 1], "plank": [0] }
    }
  },
  "exercises": {
    "bench": { "reps": null, "weight": "42.5 kg" }
  }
}
```

Completions are per day, because doing a set belongs to a session.
Adjustments are per **exercise**, because getting stronger at a lift
belongs to the movement — so raising the DB press applies on both Day 1
and Day 4, and the editor says which other days it reaches. A `null`
means "still using the programme value", so adjusting the weight never
silently freezes the reps. Adjustments survive `Reset day`; they are
your new defaults, not session progress.

State written by version 1 is migrated on read, so completed sets
recorded before adjustments existed are preserved. A payload from an
unrecognised version is treated as no data.

Completed sets are stored as indexes rather than a count, so set 1 and 3
of an exercise can be done without set 2. State is validated on read: a
different `version`, a malformed payload or unreadable storage all fall
back to an empty session rather than throwing. There is no automatic
reset — a day stays as you left it until you reset it explicitly.

If the browser refuses the write — private mode, or the origin quota is
full — the app says so in a banner rather than pretending the set was
saved. Progress still tracks for the rest of the session; it just will
not survive a reload.

The running rest timer is deliberately *not* persisted; reloading
cancels it. Checked sets survive, the countdown does not.

## Architecture

This project follows **Hexagonal Architecture**, organizing code into distinct layers with clear dependency rules and boundaries.

### Project Structure

```
www-rack-up-qual-is/
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
├── .husky/                # Git hooks (pre-commit)
├── e2e/                   # Playwright E2E tests
├── public/                # Static assets (images, fonts)
├── src/
│   ├── domain/            # Core business rules (innermost layer)
│   │   └── repositories/  # Port interfaces defining data access contracts
│   ├── application/       # Application business rules
│   │   ├── use-cases/     # Single-purpose business operations
│   │   └── services/      # Orchestration of use cases
│   ├── infrastructure/    # Framework & external dependencies (outermost layer)
│   │   ├── repositories/  # Adapter implementations (Static, LocalStorage, InMemory)
│   │   └── di/            # Dependency injection containers
│   ├── data/              # program.json, the source of truth for the program
│   ├── app/               # Interface adapters (Next.js App Router)
│   │   ├── _components/   # React components
│   │   │   └── workout/   # The workout UI
│   │   └── layout.tsx     # Root layout
│   ├── interfaces/        # TypeScript type definitions
│   └── lib/               # Utility functions and helpers
├── vitest.config.ts       # Vitest configuration
├── playwright.config.ts   # Playwright configuration
├── eslint.config.mjs      # ESLint configuration
├── next.config.js         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
```

### Layer Responsibilities

#### Domain Layer (`src/domain/`)

The core business logic, completely framework-agnostic.

- **Ports**: Interfaces that define contracts (e.g., `IProgramRepository`)
- **No external dependencies**: Cannot import from application, infrastructure, or interface layers
- **Pure business rules**: Contains only domain concepts and abstractions

#### Application Layer (`src/application/`)

Orchestrates business logic and coordinates domain objects.

- **Use Cases**: Single-purpose operations (e.g., `ToggleSetCompletionUseCase`)
- **Services**: Coordinate multiple use cases
- **Depends only on domain layer**: Cannot import from infrastructure or interface layers

#### Infrastructure Layer (`src/infrastructure/`)

Implements technical capabilities and external system integrations.

- **Adapters**: Concrete implementations of domain ports (e.g., `LocalStorageWorkoutStateRepository`)
- **Dependency Injection**: Container managing object lifecycles
- **Framework Integration**: Browser storage, static data, external APIs

#### Interface Layer (`src/app/`)

User interface and external communication.

- **Next.js Pages**: Server components and API routes
- **React Components**: UI presentation
- **Depends on application layer**: Uses services and use cases

### Architectural Testing

The project uses **dependency-cruiser** to automatically enforce hexagonal architecture boundaries. These tests ensure that:

- **Domain layer** remains pure with no outward dependencies
- **Application layer** only depends on domain and interfaces
- **Infrastructure layer** correctly implements domain ports
- **Interface layer** uses application services without direct infrastructure coupling
- **No circular dependencies** exist between modules

## Getting Started

### Prerequisites

- Node.js 22.x or later
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Development

### Available Scripts

#### Development

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

#### Code Quality

```bash
npm run lint         # Check formatting with Prettier
npm run lint:eslint  # Run ESLint checks
npm run format       # Auto-format code with Prettier
npm run type-check   # Run TypeScript type checking
npm run quality      # Run all quality checks
```

#### Testing

```bash
npm test                    # Run unit tests in watch mode
npm run test:unit           # Run unit tests once
npm run test:unit:watch     # Run unit tests in watch mode
npm run test:unit:ui        # Open Vitest UI
npm run test:coverage       # Generate coverage report
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Run E2E tests in UI mode
npm run test:e2e:debug      # Debug E2E tests
npm run test:e2e:report     # Show Playwright report
npm run test:architecture   # Run architectural boundary tests
npm run test:all            # Run all tests (audit, quality, architecture, unit, e2e)
```

#### Security

```bash
npm audit                # Check for dependency vulnerabilities
npm audit fix            # Automatically fix vulnerabilities
```

### Claude Code Skills

This project includes [Claude Code](https://claude.com/claude-code) skills (`.claude/skills/`) that assist with development workflows. Some are triggered automatically by context, while others can be invoked manually.

#### Manually Invoked

Use these by describing the action to Claude Code (e.g., "scaffold a new feature", "generate tests for this class"):

| Skill | Trigger Phrases |
|-------|----------------|
| **Hexagonal Architecture Scaffolder** | "create a new feature", "scaffold a feature", "add a new use case" |
| **Test Generator** | "generate tests", "write tests for", "add test coverage" |
| **Self-Documenting Refactor** | "remove comments", "make code self-documenting" |
| **Simplify** | "review changed code", "simplify this" |
| **Keybindings Help** | "customize keyboard shortcuts", "rebind keys" |
| **Loop** | `/loop 5m /foo` — run a command on a recurring interval |

#### Automatically Invoked

These activate based on context without any explicit request:

| Skill | When |
|-------|------|
| **Systematic Debugging** | A bug, test failure, or unexpected behavior is encountered |
| **Test-Driven Development** | Implementing a feature or bugfix |
| **Verification Before Completion** | About to claim work is complete or create a PR |
| **Claude API** | Code imports Anthropic SDK or user asks about Claude API |
