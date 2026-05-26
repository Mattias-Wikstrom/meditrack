# Error Handling

## Business logic errors

Use cases never throw for expected failure conditions. Instead they return a
`UseCaseResult<T>` (defined in `src/domain/shared/results/UseCaseResult.ts`):

```
{ successful: true;  value: T }
{ successful: false; errors: ErrorInfo[] }
```

`ErrorInfo` wraps an `ErrorCode` string (defined in
`src/domain/shared/results/ErrorCode.ts`). Current codes:

| Code | Meaning |
|---|---|
| `ActorNotFound` | The requesting actor does not exist |
| `UnauthorizedRole` | The actor's role is not permitted for this use case |
| `ActorNotAssignedToWardUnit` | A nurse action was attempted without a ward unit |
| `OrderHasAtLeastOneLine` | An order must have at least one line |
| `OrderLineQuantitiesPositive` | All line quantities must be greater than zero |
| `OrderNotFound` | The referenced order does not exist |
| `InvalidStatusTransition` | The order is not in the right status for this action |
| `MedicinalProductNotFound` | A product referenced in a delivery does not exist |
| `ProductMedicationMismatch` | A product does not belong to the specified medication |
| `SelectionQuantityMismatch` | Delivered quantities do not match the order line totals |
| `InsufficientStock` | A product does not have enough stock to cover the delivery |
| `InvalidQuantity` | A quantity value is zero or negative |

### From use case to HTTP response

REST route handlers check `result.successful` and map failures to HTTP 422:

```
{ errors: ["ErrorCode", ...] }
```

Success responses use HTTP 200 (or 201 for creation) with a `{ data: ... }` envelope.

### Authentication errors

The `requireAuth` middleware and GraphQL context both verify the JWT before a
request reaches a use case. A missing token returns HTTP 401 `{ error: "Unauthorized" }`;
an invalid or expired token returns HTTP 401 `{ error: "Invalid or expired token" }`.
GraphQL equivalents use the `UNAUTHENTICATED` extension code.

---

## UI error presentation

The UI does not use popups or toast notifications for errors. The current approach
is to render an inline error message (red text) near the action that failed —
typically just above or below the submit button on the relevant page.

More thought is needed on where and how to present different kinds of errors
consistently across the three apps. Open questions include:

- How to distinguish errors the user can act on (e.g. a validation failure) from
  errors that are not their fault (e.g. the server is unreachable).
- Whether network/infrastructure errors warrant a different, more prominent
  treatment than business rule failures, without resorting to popups.
- How to handle errors that occur in the background (e.g. a failed auto-save
  while the user is still editing).

---

## Infrastructure errors

The following lists errors that can realistically occur in the infrastructure.
Not all of them are currently handled gracefully.

### Database

| Scenario | Current behaviour |
|---|---|
| Database unreachable at server startup | `prisma.$connect()` rejects; the process exits. No retry or health-check loop. |
| Database connection lost during a request | Prisma will attempt a reconnect; if it fails the request throws an unhandled error and the client receives no response or a generic 500. |
| Connection pool exhausted under load | Requests queue and eventually time out. The timeout surfaces as an unhandled error. |
| A migration has not been run | Queries against missing columns fail with a Prisma runtime error. |
| `DATABASE_URL` not set in `.env` | Prisma throws at client initialisation; the process exits immediately. |

### Authentication

| Scenario | Current behaviour |
|---|---|
| `JWT_SECRET` not set | Token signing and verification fail with a runtime error on first use. |
| Token malformed | Caught by `requireAuth` / GraphQL context; returns 401. |
| Token expired | Caught by `requireAuth` / GraphQL context; returns 401. |
| Token signed with a different key | Caught by `requireAuth` / GraphQL context; returns 401. |

### Frontend / network

| Scenario | Current behaviour |
|---|---|
| Server unreachable (fetch fails) | The `catch` block in the page component sets an error string; shown as inline red text. The error message exposed to the user is the raw `Error.message`, which may not be meaningful. |
| GraphQL query returns an error | `urql` exposes the error in the query result; most pages do not currently check `result.error`. |
| WebSocket connection dropped | The GraphQL subscription silently stops delivering updates. The page does not indicate that real-time updates are no longer arriving. |
| Wrong `requestPolicy` on a query | A `cache-only` policy on a query that has not been fetched yet returns no data and no error, causing the page to silently show nothing. |
| Stale cache after a mutation | An optimistic or background refetch is expected to reconcile the cache; if the refetch fails the UI may show stale data without indication. |

### Server process

| Scenario | Current behaviour |
|---|---|
| Unhandled exception in a route handler | Express does not have a global error handler registered. The request hangs or crashes the process depending on where the exception occurs. |
| Unhandled promise rejection | Node.js emits an `unhandledRejection` event; the process may exit depending on the Node.js version. |
