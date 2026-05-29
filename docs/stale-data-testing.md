# Stale data: cases that need testing

Any screen that reads data from the database can display a value that has since been changed by another user or another operation. This document lists every such case across all apps, what can change, and whether a real-time update mechanism is already in place.

The general test pattern is: open the screen, trigger the change from a second session or more directly via a REST API or the CLI, then verify the first screen either updates automatically or shows a clear indication that data has changed.

---

## General update mechanism

Two complementary mechanisms work together:

**`RepositorySync` + graphcache invalidation (lazy)**
All three apps mount a `RepositorySync` component that holds open a `repositoryChanged` WebSocket subscription. On each event, `@urql/exchange-graphcache` invalidates the affected entity in the normalized cache. This ensures that navigating _to_ a page never serves stale data — but it does not immediately re-execute queries that are already mounted.

**`useRefetchOn` (eager)**
Pages that display data that can change while the user is looking at them call `useRefetchOn(entityTypes, refetch)` from `@meditrack/client`. This subscribes to `repositoryChanged` and calls `refetch({ requestPolicy: 'network-only' })` immediately whenever a matching entity type arrives. This is the mechanism responsible for live updates on mounted pages.

---

## Order status

Order status progresses through: `Draft → Sent → Confirmed → Delivered`.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Orders page | Status badge per order | Yes | Yes — `useRefetchOn('Order')` |
| Admin app — Orders page filter | Count of orders per status | Yes | Yes — `useRefetchOn('Order')` |
| Admin app — Order detail | Status badge | Yes | Yes — `useRefetchOn('Order')` |
| Nurse app — Overview page | Order count by status | Yes | Yes — `useRefetchOn('Order')` |
| Nurse app — Orders page | Order cards | Yes | Yes — `useRefetchOn('Order')` |
| CLI — `orders list` | Status column | No (snapshot) | — |
| CLI — `orders send/confirm/deliver` output | Status after action | No (result of action) | — |

**Specific case that failed:** The pharmacy app showed `1 in stock ⚠︎` during delivery instead of `0 in stock ⚠︎` after a concurrent stock change. The screen had not refreshed to reflect the delivery.

---

## Stock level

Stock level decreases when an order is delivered and increases when a product is restocked.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Inventory page | `stockLevel` per product | Yes | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Inventory page | Below-threshold warning ⚠︎ | Yes | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Inventory page | Low stock count summary | Yes | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Product detail | `stockLevel`, `isBelowThreshold` | Yes | Yes — `useRefetchOn('MedicinalProduct')` |
| Pharmacy app — Inventory page | `stockLevel` per product | Yes | Yes — `useRefetchOn('MedicinalProduct')` |
| Pharmacy app — Product detail | `stockLevel`, `isBelowThreshold` | Yes | Yes — `useRefetchOn('MedicinalProduct')` |
| Pharmacy app — Deliver order screen | Stock level shown per product selection | Yes | Yes — `useRefetchOn('MedicinalProduct')` triggers product re-query |
| CLI — `medications show` | `stock: N` per product | No (snapshot) | — |
| CLI — `medications restock` output | New stock level | No (result of action) | — |

**Failure mode:** A delivery screen reads stock level when it first loads. If another delivery or restock happens before the pharmacist confirms, the displayed level is wrong. The `SufficientStock` business rule catches this at the use case level and returns `InsufficientStock`, but the screen still shows the stale value — the user sees a confusing mismatch between what is displayed and the error message they receive.

**Recommended fix:** After receiving `InsufficientStock` or `Conflict`, the delivery screen should refresh the product list before showing the error.

---

## Order lines

Order lines (the medications and quantities on a draft order) can be edited by the nurse before the order is sent.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Nurse app — Order detail | Line items (medication, quantity) | Yes, until sent | Yes — `useRefetchOn('Order')` |
| Admin app — Orders page | Medication names and line count | Yes, until sent | Yes — `useRefetchOn('Order')` |
| Admin app — Order detail | Line items | Yes, until sent | Yes — `useRefetchOn('Order')` |
| Pharmacy app — Deliver order screen | Order lines to fulfil | No — order is Confirmed at this stage; lines are frozen | — |

---

## Product name and threshold

These change rarely (admin action required) but they can change.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Inventory page | `productName` | Rarely | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Inventory page | `stockThreshold` | Rarely | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Product detail | `productName`, `stockThreshold` | Rarely | Yes — `useRefetchOn('MedicinalProduct')` |
| Pharmacy app — Deliver order screen | `productName` in product selector | Rarely | Yes — `useRefetchOn('MedicinalProduct')` triggers product re-query |
| CLI — `medications show` | `productName` | No (snapshot) | — |

---

## Medication reference data

`innName`, `atcCode`, `form`, `strength` are immutable once created (there is no update use case for these fields). No stale-data risk.

---

## Ward unit name

Ward unit names can be changed by an admin via `UpdateWardUnitUseCase`.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Nurse app — Header | Ward unit name (app context) | Rarely | Yes — `useRefetchOn('WardUnit')` |
| Admin app — Users page | Ward unit name alongside each nurse | Rarely | Yes — `useRefetchOn('Actor', 'WardUnit')` |
| Admin app — Orders page | Ward unit name per order | Rarely | Yes — `useRefetchOn('Order', 'WardUnit')` |
| Admin app — Ward unit detail | Ward unit name | Rarely | Yes — `useRefetchOn('WardUnit', ...)` |
| CLI — `ward-units list` | Ward unit name | No (snapshot) | — |

---

## Actor list

Actors can be created, updated, or deleted by an admin. Role and ward unit assignment can change.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Users page | Actor list with roles and ward | Rarely | Yes — `useRefetchOn('Actor', 'WardUnit')` |
| Admin app — User detail | Role, ward unit assignment, recent activity | Rarely | Yes — `useRefetchOn('Actor', 'WardUnit')` |
| Admin app — Ward unit detail | Assigned nurses | Rarely | Yes — `useRefetchOn('WardUnit', 'Actor', 'Order')` |

**Remaining gap:** If an admin changes a nurse's ward unit assignment while the nurse is logged in, the nurse's session token still reflects the old `wardUnitId`. The nurse would need to log out and back in to pick up the new assignment. This is a session-level staleness that the repository change mechanism cannot address.

---

## Audit log

Append-only. Existing entries never change. New entries appear while viewing.

| Where shown | Real-time update? |
|---|---|
| Admin app — Audit page | Yes — `useRefetchOn` watches all entity types; any write produces a new audit entry |

---

## Summary: highest-risk screens

| Screen | Risk | Mechanism in place? |
|---|---|---|
| Pharmacy app — Deliver order | Stock may be stale at time of delivery | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Inventory page | Stock level and threshold warning | Yes — `useRefetchOn('MedicinalProduct')` |
| Admin app — Orders page | Order status, lines, ward unit name | Yes — `useRefetchOn('Order', 'WardUnit')` |
| Nurse app — Overview page | Order status and counts | Yes — `useRefetchOn('Order')` |
| Nurse app — Orders page | Order cards | Yes — `useRefetchOn('Order')` |
| Admin app — Users page | Actor list, roles, ward assignments | Yes — `useRefetchOn('Actor', 'WardUnit')` |
| Admin app — Audit page | New audit entries | Yes — `useRefetchOn` (all entity types) |
| CLI (all commands) | All data | No — all CLI output is a point-in-time snapshot |
