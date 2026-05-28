# Testing

## Running the tests

```sh
npm test           # single run (CI mode)
npm run test:watch # watch mode — re-runs affected tests on file changes
```

The test runner is **Vitest**. It discovers every file matching `tests/**/*.test.ts`.

---

## Where the tests live

```
tests/
├── unit/               # Pure domain logic — no I/O of any kind
│   ├── medication/
│   └── order/
├── useCases/           # Use case layer — one file per use case class
│   ├── actor/
│   ├── fulfillment/
│   ├── medication/
│   ├── ordering/
│   └── wardUnit/
├── graphql/            # GraphQL resolver tests
│   ├── medications.test.ts
│   └── orders.test.ts
├── storage/            # Infrastructure utilities
│   └── observing.test.ts
├── ui/
│   └── cli/            # CLI command tests
│       ├── medications.test.ts
│       ├── orders.test.ts
│       └── graphql.test.ts
└── helpers/
    └── createTestContext.ts   # Shared wiring helper (see below)
```

---

## How the tests work

### No database required

Every test runs entirely in memory. The domain layer is designed around repository
interfaces, and all tests use in-memory implementations of those interfaces
(`InMemoryOrderRepository`, `InMemoryMedicationRepository`, etc.) instead of the
Prisma-backed ones used in production. This means:

- Tests start instantly — no connection setup.
- Tests are isolated — each test gets a fresh set of repositories in its `beforeEach`.
- The same use case code that runs in production is exercised; only the storage
  layer differs.

### Dependency injection keeps things testable

Use cases receive their dependencies (repositories, event bus, transactor) through
their constructors. Tests wire them up explicitly:

```ts
const medicationRepo = new InMemoryMedicationRepository();
const actorRepo = new InMemoryActorRepository();
const transactor = new InMemoryTransactor();

const useCase = new CreateMedicationUseCase(medicationRepo, actorRepo, transactor);
```

There is no service locator or global state to stub out.

### Four test layers

**1. Unit tests (`tests/unit/`)**

The smallest tests. They exercise domain objects and business rules in isolation —
no repositories, no use cases, no I/O. A typical test instantiates a rule class and
calls `.check(order)` directly:

```ts
const rule = new OrderHasAtLeastOneLine();
const result = rule.check(emptyOrder);
expect(result).not.toBeNull(); // rule violated
```

**2. Use case tests (`tests/useCases/`)**

One test file per use case class. These tests cover the full use-case logic including
authorisation, business rules, persistence (to in-memory repos), and audit logging.
A passing test typically verifies:

- The return value (`result.successful`, `result.value`, or `result.errors`).
- That the repository contains the expected state after the operation.
- That an audit entry was recorded.
- That the operation fails correctly when the actor has the wrong role or data is missing.

**3. GraphQL tests (`tests/graphql/`)**

These tests execute raw GraphQL query strings against the real schema using an
in-memory context, verifying that resolvers return the right shape and data.
The `graphql()` function from the `graphql` package is used directly — no HTTP
layer involved.

**4. CLI tests (`tests/ui/cli/`)**

These tests call CLI command functions (e.g. `createOrder`, `sendOrder`) with a
`RecordingOutput` test double instead of real stdout/stderr. Tests assert on the
printed lines and on the exit code thrown when a command fails.

### Shared helper: `createTestContext`

GraphQL and some CLI tests use `createTestContext()` from `tests/helpers/createTestContext.ts`.
It returns a fully wired `GraphQLContext` — all repositories and use cases instantiated and
connected — with a small set of pre-seeded actors. Tests then populate the repositories as
needed before running a query or mutation.

### The `SimpleEventBus`

Use case tests that exercise event-emitting code pass a `SimpleEventBus` to the use case.
The simple bus is synchronous and in-memory, so tests can optionally subscribe to it and
assert that the right events were published.

---

## What is and is not covered

The tests cover the domain layer and use cases thoroughly. GraphQL resolvers and CLI
commands have a reasonable level of coverage. The React frontend apps do not currently
have automated tests.
