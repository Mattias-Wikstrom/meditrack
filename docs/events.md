# Events

MediTrack has two separate event channels that serve different purposes: **domain events** and
**repository change events**. Both are delivered to GraphQL subscription clients over WebSocket
in real time.

---

## Domain events

Domain events represent things that happened in the business domain — order lifecycle transitions,
stock alerts, restocking. They are intentional and named after the business concept they capture.

### Interface

```ts
// src/domain/shared/eventContracts/DomainEvent.ts
interface DomainEvent {
  readonly eventType: string;
  readonly actorId: string;
  readonly occurredAt: Date;
}
```

### Catalogue

#### Exposed via GraphQL subscription

These events are published by use cases **and** wired into `pubSub.ts` / `Subscription.ts`, so
external subscribers (frontends, spy tools) can receive them over WebSocket.

| Event class | `eventType` string | Emitted when |
|---|---|---|
| `DraftOrderCreated` | `DraftOrderCreated` | A new draft order is created |
| `DraftOrderUpdated` | `DraftOrderUpdated` | A draft order's lines are changed |
| `OrderStatusAdvanced` | `OrderStatusAdvanced` | An order moves to the next status (Sent / Confirmed / Delivered) |
| `StockBelowThreshold` | `StockBelowThreshold` | A delivery drops a product's stock below its threshold |
| `ProductRestocked` | `ProductRestocked` | Units are added to a product's stock |

#### Published internally, no GraphQL subscription yet

These events are published by their use cases into the `EventBus` but are not yet registered in
`pubSub.ts` or `Subscription.ts`, so they are in-process only.

| Event class | `eventType` string | Emitted when |
|---|---|---|
| `ActorCreated` | `ActorCreated` | A new actor (user account) is created |
| `ActorUpdated` | `ActorUpdated` | An actor's details are changed |
| `ActorDeleted` | `ActorDeleted` | An actor is deleted |
| `WardUnitCreated` | `WardUnitCreated` | A new ward unit is created |
| `WardUnitUpdated` | `WardUnitUpdated` | A ward unit's details are changed |
| `WardUnitDeleted` | `WardUnitDeleted` | A ward unit is deleted |

#### Defined but unused

| Event class | Notes |
|---|---|
| `OrderDelivered` | Class exists in `src/domain/order/events/` but is never instantiated. `DeliverOrderUseCase` publishes `OrderStatusAdvanced` instead. |

Each event class lives under `src/domain/<aggregate>/events/`.

### How events are published

Use cases publish events **after** the database transaction commits. The transaction writes and
the audit record are atomic; the event is not part of the transaction.

```ts
// Example from DeliverOrderUseCase
await this.transactor.run(async (tx) => {
  // ... save stock changes, update order status, write audit record
});

// Events published after commit:
for (const ev of thresholdEvents) {
  await this.eventBus.publish(ev);
}
await this.eventBus.publish(new OrderStatusAdvanced(...));
```

### EventBus implementations

| Class | Used in | Behaviour |
|---|---|---|
| `SimpleEventBus` | Tests | Synchronous, in-memory, fan-out to registered `EventListener`s |
| `PubSubEventBus` | Production server | Forwards to graphql-yoga's `pubSub`; `subscribe()` is a no-op because GraphQL subscriptions consume `pubSub` directly |

The server wires up `PubSubEventBus` at startup (`src/ui/server/server.ts`) and passes it into
every use case via `createWiring`.

### GraphQL subscriptions (domain events)

```graphql
subscription { orderDraftCreated   { orderId wardUnitId actorId } }
subscription { orderDraftUpdated   { orderId actorId } }
subscription { orderStatusChanged  { orderId from to actorId } }
subscription { stockBelowThreshold { medicinalProductId productName medicationId stockLevel stockThreshold } }
subscription { productRestocked    { medicinalProductId productName stockLevel } }
```

---

## Repository change events

Repository change events are lower-level. They fire on every `save` or `delete` call to any
repository, regardless of what triggered the write — a GraphQL mutation, a REST call, or any
other path through the system.

### Shape

```ts
type RepositoryChange<T> =
  | { kind: 'saved';   entityType: string; entity: T }
  | { kind: 'deleted'; entityType: string; id: unknown };
```

### How changes are captured

`observing()` (`src/infrastructure/repositoryChange/observing.ts`) is a JavaScript `Proxy` that
wraps any repository and intercepts its `save` and `delete` methods. After the original method
resolves, it publishes the change to a `RepositoryChangeBus`.

`PrismaTransactor` wraps all transactional repositories with `observing()`, but buffers the
change events during the transaction. They are only published to the real bus **after the
transaction commits**, avoiding spurious notifications for rolled-back writes.

```
use case → transactor.run(tx => tx.medicinalProductRepository.save(...))
                          ↓
              [write buffered, tx commits]
                          ↓
              changeBus.publish({ kind:'saved', entityType:'MedicinalProduct', entity })
```

### Known entity types

`MedicinalProduct`, `Medication`, `Order`, `Actor`, `WardUnit`

### GraphQL subscriptions (repository changes)

```graphql
# All entity changes (any kind, any type):
subscription { repositoryChanged { entityType kind entityId } }

# Only saved MedicinalProduct entities (full fields):
subscription { medicinalProductUpdated { id productName medicationId stockLevel stockThreshold isBelowThreshold } }
```

`medicinalProductUpdated` is used by all three frontend apps to keep displayed stock levels fresh
in real time. Because it is driven by the repository change bus rather than a named domain event,
it fires for every write to `MedicinalProduct` — price changes, threshold adjustments, restocks,
and delivery deductions all update the UI automatically.

---

## How the two channels fit together

```
Use case
  │
  ├─ transactor.run(tx) ────────────────────────────────────────────┐
  │    tx.repo.save(entity)                                          │
  │    tx.auditRepository.record(...)                               │  Prisma transaction
  │                                                                  │  (atomic)
  └─────────────────────────────────────────────────────────────────┘
       ↓ (on commit)
  changeBus.publish({ kind:'saved', entityType, entity })    ← RepositoryChangeBus
       ↓
  changePubSub → medicinalProductUpdated  }
              → repositoryChanged         }  GraphQL subscriptions
       
  eventBus.publish(new SomeDomainEvent())                   ← EventBus (post-commit)
       ↓
  pubSub → orderStatusChanged             }
         → stockBelowThreshold            }  GraphQL subscriptions
         → productRestocked               }
         → ...                            }
```

---

## Spy tools

Two CLI tools let you observe live events from a running server without modifying application code.

### `repos:spy` — repository change spy

Subscribes to the `repositoryChanged` GraphQL subscription and prints every entity save or delete.

```sh
npm run repos:spy                            # watch all entity types
npm run repos:spy -- -e MedicinalProduct     # filter to one type
npm run repos:spy -- -e MedicinalProduct,Order
npm run repos:spy -- --compact               # single-line JSON output
npm run repos:spy -- --url ws://host:4000/graphql --token <jwt>
```

Output example:
```
[2026-05-28T12:00:00.000Z] saved MedicinalProduct abc-123
{
  "entityType": "MedicinalProduct",
  "kind": "saved",
  "entityId": "abc-123"
}
```

Authentication uses the stored CLI session by default (see `npm run mt-cli -- login`).

### `events-spy` — domain event spy

Subscribes to one or more named GraphQL subscriptions and prints each event as it arrives.

```sh
npx tsx src/ui/cli/events/spy.ts                             # all domain events
npx tsx src/ui/cli/events/spy.ts -- -e stockBelowThreshold  # specific events
npx tsx src/ui/cli/events/spy.ts -- -e stockBelowThreshold,productRestocked
npx tsx src/ui/cli/events/spy.ts -- --compact
```

Available event names (pass to `-e` as a comma-separated list):

| Name | Description |
|---|---|
| `orderDraftCreated` | New draft order created |
| `orderDraftUpdated` | Draft order lines changed |
| `orderStatusChanged` | Order advanced to next status |
| `stockBelowThreshold` | Stock fell below threshold |
| `productRestocked` | Units added to stock |
| `medicinalProductUpdated` | Any `MedicinalProduct` field changed |

### `events-trigger` — trigger events via the REST API

A convenience wrapper around the REST API for triggering specific events during development or
manual testing. Events are always emitted as side effects of real business operations — they are
not injected directly.

```sh
npx tsx src/ui/cli/events/trigger.ts --help

# Examples:
npx tsx src/ui/cli/events/trigger.ts create-order --medication-id <id> --quantity 5
npx tsx src/ui/cli/events/trigger.ts send-order    --order-id <id>
npx tsx src/ui/cli/events/trigger.ts confirm-order --order-id <id>
npx tsx src/ui/cli/events/trigger.ts deliver-order --order-id <id> \
  --product <medicationId>:<medicinalProductId>:<quantity>
npx tsx src/ui/cli/events/trigger.ts restock        --product-id <id> --quantity 10
npx tsx src/ui/cli/events/trigger.ts update-product --product-id <id> --stock-threshold 5
```

Event → action mapping:

| Event | Trigger action |
|---|---|
| `orderDraftCreated` | `create-order` |
| `orderDraftUpdated` | `update-order` |
| `orderStatusChanged` | `send-order` / `confirm-order` / `deliver-order` |
| `productRestocked` | `restock` (always emitted) |
| `stockBelowThreshold` | `restock` (if stock stays below threshold) · `deliver-order` (if delivery drops below) |
| `medicinalProductUpdated` | `update-product` |

Set `MEDITRACK_API_URL` to override the default `http://localhost:4000/api`.

---

## Adding a new domain event

1. Create an event class under `src/domain/<aggregate>/events/MyEvent.ts` implementing `DomainEvent`.
2. Publish it from the relevant use case via `this.eventBus.publish(new MyEvent(...))` after the transaction.
3. Add the typed channel to `src/eventBus/pubSub.ts`:
   ```ts
   MyEvent: [event: MyEvent];
   ```
4. Add a resolver to `src/api/graphql/resolvers/Subscription.ts`:
   ```ts
   myEvent: {
     subscribe: () => pubSub.subscribe('MyEvent'),
     resolve: (event: MyEvent) => ({ /* shape for GraphQL */ }),
   },
   ```
5. Add the subscription field to `src/api/graphql/typeDefs.ts`.
6. Add it to the `SUBSCRIPTIONS` map in `src/ui/cli/events/spy.ts` so the spy tool picks it up.
