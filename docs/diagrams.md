# Architecture Diagrams

## System Overview

The three frontend apps communicate with the single backend over REST (mutations), GraphQL HTTP (queries), and GraphQL WebSocket (real-time subscriptions). All apps share code via the `packages/` workspace.

```mermaid
graph TD
  subgraph "Frontend apps"
    N["Nurse App\napps/nurse"]
    P["Pharmacist App\napps/pharmacist"]
    A["Admin App\napps/admin"]
  end

  subgraph "Shared packages"
    UI["packages/ui\nReact components"]
    CL["packages/client\nAuthContext · HTTP/GQL client"]
    CF["packages/config\nBase URLs"]
  end

  subgraph "Backend · localhost:4000"
    REST["REST API\nPOST /api/..."]
    GQL["GraphQL HTTP\n/graphql"]
    WS["GraphQL WebSocket\nws://localhost:4000/graphql"]
    DOMAIN["Domain layer\nUse cases · Business rules"]
    REPOS["Repository layer\nPrisma implementations"]
    EB["PubSubEventBus"]
  end

  DB[("PostgreSQL")]

  N & P & A --> UI & CL & CF
  CL -->|"mutations (JWT)"| REST
  CL -->|"queries (JWT)"| GQL
  CL -->|"subscriptions (JWT in connectionParams)"| WS
  REST --> DOMAIN
  GQL --> DOMAIN
  DOMAIN --> REPOS
  DOMAIN --> EB
  EB --> WS
  REPOS --> DB
```

---

## Data Model

Relationships between the persisted entities (as defined in `prisma/schema.prisma`).

```mermaid
erDiagram
  WardUnit {
    string id PK
    string name
  }
  Actor {
    string id PK
    string role
    string passwordHash
    string wardUnitId FK "optional"
  }
  Order {
    string id PK
    string wardUnitId "no FK – resolved at query time"
    string status
    datetime createdAt
  }
  OrderLine {
    int id PK "surrogate key"
    string orderId FK
    string medicationId FK
    int quantity
  }
  Medication {
    string id PK
    string innName
    string atcCode
    string form
    string strength
  }
  MedicinalProduct {
    string id PK
    string productName
    string medicationId FK
    int stockLevel
    int stockThreshold
  }
  AuditLog {
    int id PK
    string actorId "no FK"
    string action
    string entityId
    datetime occurredAt
  }

  WardUnit ||--o{ Actor : "has"
  Order ||--o{ OrderLine : "contains"
  Medication ||--o{ MedicinalProduct : "has"
  Medication ||--o{ OrderLine : "referenced by"
```

---

## Order Lifecycle

An order moves through four statuses. Only a Nurse can create and send orders; only a Pharmacist can confirm and deliver them.

```mermaid
stateDiagram-v2
  [*] --> Draft : Nurse – CreateOrder
  Draft --> Draft : Nurse – UpdateOrderLines
  Draft --> Sent : Nurse – SendOrder
  Sent --> Confirmed : Pharmacist – ConfirmOrder
  Confirmed --> Delivered : Pharmacist – DeliverOrder
  Delivered --> [*]
```

---

## Request Flow (Layered Architecture)

Every request passes through auth middleware, then reaches a use case via the `ServerWiring` object assembled in `src/ui/server/wiring.ts`. Use cases depend only on repository *interfaces*, so the storage layer is swappable (Prisma for production, in-memory for tests).

```mermaid
graph LR
  Client["Frontend App"]

  subgraph "src/ui/server"
    Server["HTTP Server\n(graphql-yoga)"]
    Auth["requireAuth\nmiddleware"]
    Wiring["ServerWiring\nwiring.ts"]
  end

  subgraph "src/domain"
    UC["Use Case"]
    Rules["Business Rules"]
    Ifaces["Repository Interfaces"]
  end

  subgraph "src/storage"
    Prisma["Prisma Repositories\n(PostgreSQL)"]
    InMem["In-Memory Repositories\n(tests)"]
  end

  Client -->|"HTTP / WS"| Server
  Server --> Auth
  Auth --> Wiring
  Wiring --> UC
  UC --> Rules
  UC --> Ifaces
  Ifaces -.->|production| Prisma
  Ifaces -.->|tests| InMem
```

---

## Real-Time Event Flow

When a use case mutates state it publishes a domain event through the `EventBus`. In the running server this is `PubSubEventBus`, which bridges the event into graphql-yoga's pub/sub system so subscribed frontend clients are notified immediately.

```mermaid
sequenceDiagram
  actor Nurse
  participant REST as REST API
  participant UC as Use Case
  participant EB as PubSubEventBus
  participant PubSub as graphql-yoga pub/sub
  participant WS as WebSocket connection
  actor Pharmacist

  Nurse->>REST: POST /api/orders  (Bearer JWT)
  REST->>UC: CreateOrderUseCase.execute()
  UC->>EB: publish(DraftOrderCreated)
  EB->>PubSub: pubsub.publish("orderDraftCreated", payload)
  PubSub->>WS: push event
  WS-->>Pharmacist: subscription · orderDraftCreated
  Note over Pharmacist: UI updates without polling
```

**Current domain events**

| Event | Subscription |
|---|---|
| `DraftOrderCreated` | `orderDraftCreated` |
| `DraftOrderUpdated` | `orderDraftUpdated` |
| `OrderStatusAdvanced` | `orderStatusChanged` |
| `StockBelowThreshold` | `stockBelowThreshold` |
