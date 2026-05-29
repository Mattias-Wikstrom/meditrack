# Stale data: cases that need testing

Any screen that reads data from the database can display a value that has since been changed by another user or another operation. This document lists every such case across all apps, what can change, and whether a real-time update mechanism is already in place.

The general test pattern is: open the screen, trigger the change from a second session or more directly via a REST API or the CLI, then verify the first screen either updates automatically or shows a clear indication that data has changed.

---

## General update mechanism

All three apps mount a `RepositorySync` component (from `@meditrack/client`) that holds open a `repositoryChanged` WebSocket subscription. The server emits one event for every entity saved or deleted. On each event, `@urql/exchange-graphcache` automatically invalidates the affected entity and its list query, causing any active urql query that references that entity to refetch.

This means most stale-data cases are handled automatically without page-level subscription code. The exceptions are noted below.

---

## Order status

Order status progresses through: `Draft → Sent → Confirmed → Delivered`.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Orders page | Status badge per order | Yes | Yes — `repositoryChanged` / graphcache |
| Admin app — Orders page filter | Count of orders per status | Yes | Yes — `repositoryChanged` / graphcache |
| Nurse app — Overview page | Order count by status | Yes | Subscription `orderStatusChanged` |
| Nurse app — Overview page | Order cards | Yes | Subscriptions `orderStatusChanged`, `orderDraftCreated` |
| CLI — `orders list` | Status column | No (snapshot) | — |
| CLI — `orders send/confirm/deliver` output | Status after action | No (result of action) | — |

**Specific case that failed:** The pharmacy app showed `1 in stock ⚠︎` during delivery instead of `0 in stock ⚠︎` after a concurrent stock change. The screen had not refreshed to reflect the delivery.

---

## Stock level

Stock level decreases when an order is delivered and increases when a product is restocked.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Inventory page | `stockLevel` per product | Yes | Yes — `repositoryChanged` / graphcache |
| Admin app — Inventory page | Below-threshold warning ⚠︎ | Yes | Yes — `repositoryChanged` / graphcache |
| Admin app — Inventory page | Low stock count summary | Yes | Yes — `repositoryChanged` / graphcache |
| Admin app — Product detail | `stockLevel`, `isBelowThreshold` | Yes | Yes — `repositoryChanged` / graphcache |
| Pharmacy app — Deliver order screen | Stock level shown per product selection | Yes | Yes — `repositoryChanged` / graphcache |
| CLI — `medications show` | `stock: N` per product | No (snapshot) | — |
| CLI — `medications restock` output | New stock level | No (result of action) | — |

**Failure mode:** A delivery screen reads stock level when it first loads. If another delivery or restock happens before the pharmacist confirms, the displayed level is wrong. The `SufficientStock` business rule catches this at the use case level and returns `InsufficientStock`, but the screen still shows the stale value — the user sees a confusing mismatch between what is displayed and the error message they receive.

**Recommended fix:** After receiving `InsufficientStock` or `Conflict`, the delivery screen should refresh the product list before showing the error.

---

## Order lines

Order lines (the medications and quantities on a draft order) can be edited by the nurse before the order is sent.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Nurse app — Order detail | Line items (medication, quantity) | Yes, until sent | Subscription `orderDraftUpdated` |
| Admin app — Orders page | Medication names and line count | Yes, until sent | Yes — `repositoryChanged` / graphcache |
| Pharmacy app — Deliver order screen | Order lines to fulfil | Yes, until confirmed | Yes — `repositoryChanged` / graphcache |

---

## Product name and threshold

These change rarely (admin action required) but they can change.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Inventory page | `productName` | Rarely | Yes — `repositoryChanged` / graphcache |
| Admin app — Inventory page | `stockThreshold` | Rarely | Yes — `repositoryChanged` / graphcache |
| Pharmacy app — Deliver order screen | `productName` in product selector | Rarely | Yes — `repositoryChanged` / graphcache |
| CLI — `medications show` | `productName` | No (snapshot) | — |

---

## Medication reference data

`innName`, `atcCode`, `form`, `strength` are immutable once created (there is no update use case for these fields). No stale-data risk.

---

## Ward unit name

Ward unit names can be changed by an admin via `UpdateWardUnitUseCase`.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Nurse app — Header | Ward unit name (app context) | Rarely | Yes — `repositoryChanged` / graphcache |
| Admin app — Users page | Ward unit name alongside each nurse | Rarely | Yes — `repositoryChanged` / graphcache |
| Admin app — Orders page | Ward unit name per order | Rarely | Yes — `repositoryChanged` / graphcache |
| Nurse app — Overview page | Ward unit context | Rarely | Yes — `repositoryChanged` / graphcache |
| CLI — `ward-units list` | Ward unit name | No (snapshot) | — |

---

## Actor list

Actors can be created, updated, or deleted by an admin. Role and ward unit assignment can change.

| Where shown | What is displayed | Can change while viewing? | Real-time update? |
|---|---|---|---|
| Admin app — Users page | Actor list with roles and ward | Rarely | Yes — `repositoryChanged` / graphcache |

**Remaining gap:** If an admin changes a nurse's ward unit assignment while the nurse is logged in, the nurse's session token still reflects the old `wardUnitId`. The nurse would need to log out and back in to pick up the new assignment. This is a session-level staleness that the repository change mechanism cannot address.

---

## Audit log

Append-only. Existing entries never change. New entries appear while viewing.

| Where shown | Real-time update? |
|---|---|
| Admin app — Audit page | Yes — any `repositoryChanged` event invalidates `auditLog` (every write produces an audit entry, even though `AuditRepository` itself is not observed) |

---

## Summary: highest-risk screens

| Screen | Risk | Mechanism in place? |
|---|---|---|
| Pharmacy app — Deliver order | Stock may be stale at time of delivery | Yes — `repositoryChanged` / graphcache |
| Admin app — Inventory page | Stock level and threshold warning | Yes — `repositoryChanged` / graphcache |
| Admin app — Orders page | Order status, lines, ward unit name | Yes — `repositoryChanged` / graphcache |
| Nurse app — Overview page | Order status and counts | Yes — `orderStatusChanged` subscription |
| Admin app — Users page | Actor list, roles, ward assignments | Yes — `repositoryChanged` / graphcache |
| Admin app — Orders page / Nurse app | Ward unit name shown alongside orders | Yes — `repositoryChanged` / graphcache |
| Admin app — Audit page | New audit entries | Yes — `repositoryChanged` / graphcache |
| CLI (all commands) | All data | No — all CLI output is a point-in-time snapshot |
