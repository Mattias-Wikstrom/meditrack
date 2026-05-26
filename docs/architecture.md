# Technical Architecture

## Overview

MediTrack is a monorepo (npm workspaces) consisting of a Node.js backend, three React frontend
applications, and shared packages. The backend exposes both REST and GraphQL endpoints; the
frontend apps consume them.

```
meditrack/
├── apps/
│   ├── nurse/          # Nurse-facing web app
│   ├── pharmacist/     # Pharmacist-facing web app
│   └── admin/          # Admin-facing web app
├── packages/
│   ├── ui/             # Shared React components
│   ├── client/         # Shared auth context, HTTP/GraphQL client utilities
│   └── config/         # Shared configuration
├── src/                # Backend source code
│   ├── domain/         # Domain model (entities, use cases, business rules, events)
│   ├── storage/        # Repository implementations (Prisma + in-memory)
│   ├── eventBus/       # Event bus implementations
│   ├── api/            # GraphQL schema and resolvers
│   └── ui/
│       ├── cli/        # CLI entry point and commands
│       └── server/     # HTTP server, REST routes, wiring
├── prisma/             # Database schema and migrations
├── docs/               # Documentation
└── codegen.ts          # GraphQL code generation config
```

---

## Database

The system uses **PostgreSQL**. The database schema is managed with **Prisma**, which also
generates the TypeScript client used by the backend.

The schema is defined in `prisma/schema.prisma`. After changes to the schema, run:

```sh
npx prisma generate      # Regenerate the Prisma client
npx prisma migrate dev   # Apply schema changes as a migration
```

Connection details (host, port, database name, credentials) are read from the `.env` file via
the `DATABASE_URL` environment variable.

---

## Backend

### Starting the server

```sh
npm run server
```

The server starts on `http://localhost:4000` by default.

For a quick way to interact with the backend without a browser, see the [CLI reference](cli.md).

### Configuration

All runtime configuration is in the `.env` file at the project root. The most important entry
is `DATABASE_URL`, which Prisma uses to connect to PostgreSQL.

### Domain layer (`src/domain/`)

The domain layer models the business and is organised by subdomain:

| Subdomain | Path | Key contents |
|---|---|---|
| Shared | `src/domain/shared/` | `Actor`, `ActorRole`, ID types, `UseCaseResult`, `ErrorCode`, `AuditEntry`, event contracts |
| Auth | `src/domain/auth/` | `LoginUseCase`, `SetPasswordUseCase`, `ChangePasswordUseCase`, `CredentialsRepository` |
| Order | `src/domain/order/` | `Order`, `OrderStatus`, `OrderRepository`; use cases for creating, updating, sending, confirming, and delivering orders; business rules |
| Medication | `src/domain/medication/` | `Medication`, `MedicinalProduct`, `RestockUseCase`, `StockBelowThreshold` event |
| Ward unit | `src/domain/wardUnit/` | `WardUnit`, `WardUnitRepository` |
| Actor | `src/domain/actor/` | `ActorRepository` |
| Audit | `src/domain/audit/` | `AuditRepository` |

**Use cases** are explicit classes. Each use case receives the repositories and other
dependencies it needs through its constructor (dependency injection), which keeps the use case
code independent of storage and infrastructure.

**Business rules** are also explicit classes. For example, the order subdomain has rules such as
`OrderHasAtLeastOneLine`, `SufficientStock`, and `DeliveryCoversOrder`. A use case evaluates the
relevant rules and returns a typed `UseCaseResult<T>` — either a success value or an `ErrorCode`
— rather than throwing exceptions.

### Authentication and authorisation

Actors (users) authenticate via a JWT. Every request to a protected endpoint must include a
`Bearer` token in the `Authorization` header.

Use cases enforce role-based access. A typical use case will succeed only if the requesting actor
holds a specific `ActorRole`. There is no superuser role: privileged access is granted by
assigning a specific role to an actor. Direct database access is always an option for exceptional
situations.

### Audit logging

Every use case that mutates state records an `AuditEntry` through the `AuditRepository`. The
audit log is stored in the `AuditLog` table in PostgreSQL. Writes to business data and the
corresponding audit entry are always committed in the same database transaction via the
`Transactor` abstraction, so the log cannot fall out of sync with the data.

### Repository pattern

All persistence is hidden behind domain interfaces (e.g. `OrderRepository`,
`MedicationRepository`). There are two sets of concrete implementations:

- **`src/storage/prisma/`** — production implementations backed by PostgreSQL via the Prisma
  client (e.g. `PrismaOrderRepository`, `PrismaAuditRepository`, `PrismaTransactor`).
- **`src/storage/inMemory/`** — in-memory implementations used in unit tests (e.g.
  `InMemoryOrderRepository`, `InMemoryAuditRepository`, `InMemoryTransactor`).

Use case code depends only on the interfaces, so it cannot tell which implementation is active.

### Event system

Domain events are published through an `EventBus` interface defined in
`src/domain/shared/eventContracts/`:

```
EventBus.publish(event: DomainEvent): Promise<void>
EventBus.subscribe(eventType: string, listener: EventListener): void
```

There are two implementations:

- **`SimpleEventBus`** (`src/eventBus/SimpleEventBus.ts`) — an in-memory map of event type to
  listener list, used in unit tests.
- **`PubSubEventBus`** (`src/ui/server/PubSubEventBus.ts`) — used in the running server. It
  bridges domain events to the graphql-yoga pub/sub system so that they can be delivered to
  GraphQL subscription clients.

Current domain events include `DraftOrderCreated`, `DraftOrderUpdated`, `OrderStatusAdvanced`,
`OrderDelivered`, and `StockBelowThreshold`.

### Dependency injection (`src/ui/server/wiring.ts`)

All repositories, event bus, and use cases are instantiated in `createWiring()` and returned as a
`ServerWiring` object. This object is injected into REST route handlers and the GraphQL context,
giving them access to the use cases and repositories they need without import-time coupling.

### REST API

REST routes are defined under `src/ui/server/rest/`:

| File | Endpoints |
|---|---|
| `auth.ts` | `POST /api/auth/login`, `POST /api/auth/change-password` |
| `actors.ts` | `GET /api/actors` |
| `orders.ts` | `POST /api/orders/`, `POST /api/orders/:id/lines`, `POST /api/orders/:id/send`, `POST /api/orders/:id/confirm`, `POST /api/orders/:id/deliver` |

All endpoints except `/api/auth/login` require a valid JWT (enforced by `requireAuth` middleware).
REST endpoints are used for **mutations** (state-changing operations).

### GraphQL API

The GraphQL schema and resolvers live under `src/api/graphql/`. The endpoint is
`http://localhost:4000/graphql`.

GraphQL is used for **read-only queries** (fetching data to display in the apps). Mutations are
handled through the REST API.

### Real-time updates (WebSockets / GraphQL subscriptions)

The server also accepts WebSocket connections at `ws://localhost:4000/graphql`, implemented with
`graphql-ws` and `graphql-yoga`.

When an actor performs an action that raises a domain event, the `PubSubEventBus` publishes it
to the graphql-yoga pub/sub system. Frontend clients that have subscribed to the relevant
GraphQL subscription receive the update in real time without polling.

Current subscriptions: `orderDraftCreated`, `orderDraftUpdated`, `orderStatusChanged`,
`stockBelowThreshold`.

The JWT is passed in the WebSocket `connectionParams` so that subscription connections are
authenticated in the same way as HTTP requests.

---

## Frontend apps

There are three separate apps, one per user role:

| App | Workspace | Dev command |
|---|---|---|
| Nurse | `apps/nurse` | `npm run dev --workspace apps/nurse` |
| Pharmacist | `apps/pharmacist` | `npm run dev --workspace apps/pharmacist` |
| Admin | `apps/admin` | `npm run dev --workspace apps/admin` |

Each app is written in TypeScript and uses React. Having one app per role means that each user
sees exactly the functionality they need, and testing does not require switching roles in a shared
interface.

### Shared packages

Code shared between apps lives in `packages/`:

- **`packages/ui/`** — shared React components (`AppShell`, `Button`, `Card`, `Badge`,
  `LoginPage`, `MedicationDetail`, `OrderCard`, `Spinner`, `TabNav`, `BackButton`, …). Using
  these components keeps the visual design consistent across all three apps.
- **`packages/client/`** — shared infrastructure: `AuthContext` (React context for the current
  user/token), GraphQL client setup, and HTTP client utilities.
- **`packages/config/`** — shared configuration (e.g. base URLs).

### Generated client-side code (`npm run codegen`)

Each app contains a `src/gql/` directory with TypeScript types that mirror GraphQL types
and operations. These files are **generated automatically** from the GraphQL schema and the
GraphQL operations (queries, mutations, fragments) written in each app's `.ts`/`.tsx` files.

The generator is **GraphQL Code Generator** (`@graphql-codegen/client-preset`), configured in
`codegen.ts` at the project root. Run code generation after changing the GraphQL schema or adding
new operations:

```sh
npm run codegen
```

The generated files should not be edited by hand — changes to them will be overwritten the next
time codegen runs.

---

## Testing

Unit tests use the **in-memory repository** and **`SimpleEventBus`** implementations. This means:

- No database is required to run unit tests.
- Use case logic is tested in isolation from infrastructure.
- The same use case code that runs in production is exercised in tests; only the storage and
  event bus implementations differ.
