# meditrack CLI

A command-line interface for managing medications and orders against the meditrack PostgreSQL database.

## Prerequisites

- PostgreSQL running and reachable
- `.env` file at the project root with `DATABASE_URL` set (see `.env.example`)

## Running commands

All commands are run via the `cli` npm script. Arguments after `--` are passed to the program:

```
npm run cli -- <command> [options]
```

---

## medications

### list

List all medications. Optionally filter by INN name, ATC code, or form.

```
npm run cli -- medications list [-q <query>]
```

**Options**

| Flag | Description |
|------|-------------|
| `-q, --query <query>` | Filter by INN name, ATC code, or form (case-insensitive) |

**Examples**

```
$ npm run cli -- medications list
med-1  Paracetamol  N02BE01  Tablet  500mg
med-2  Ibuprofen    M01AE01  Tablet  400mg

$ npm run cli -- medications list -q para
med-1  Paracetamol  N02BE01  Tablet  500mg
```

---

### show

Show full details for a single medication, including all registered medicinal products and their stock levels.

```
npm run cli -- medications show <id>
```

**Examples**

```
$ npm run cli -- medications show med-1
Paracetamol (N02BE01)
Form: Tablet   Strength: 500mg

Medicinal products:
  prod-1  Alvedon 500mg  stock: 42
  prod-2  Panodil 500mg  stock: 3  *** BELOW THRESHOLD ***
```

Stock is flagged with `*** BELOW THRESHOLD ***` when it is at or below the product's configured threshold.

---

## orders

### list

List all orders across all ward units.

```
npm run cli -- orders list
```

**Example**

```
$ npm run cli -- orders list
ord-1  Draft      ward: ward-1  lines: 2
ord-2  Confirmed  ward: ward-2  lines: 1
```

---

### create

Create a new order in `Draft` status. Currently creates a single-line order (one medication per invocation).

```
npm run cli -- orders create --ward-unit-id <id> --medication-id <id> --quantity <n>
```

**Options**

| Flag | Description |
|------|-------------|
| `--ward-unit-id <id>` | ID of the ward unit placing the order |
| `--medication-id <id>` | ID of the medication being ordered |
| `--quantity <n>` | Quantity to order (integer) |

**Example**

```
$ npm run cli -- orders create --ward-unit-id ward-1 --medication-id med-1 --quantity 50
Order created: ord-abc123  status: Draft
```

---

### advance

Advance an order to the next status. Each call moves the order one step forward:

```
Draft → Sent → Confirmed
```

```
npm run cli -- orders advance <orderId>
```

**Example**

```
$ npm run cli -- orders advance ord-abc123
Order ord-abc123 is now: Sent

$ npm run cli -- orders advance ord-abc123
Order ord-abc123 is now: Confirmed
```

---

### deliver

Mark a `Confirmed` order as delivered. Requires an explicit product selection for every order line — the pharmacist specifies which medicinal product was used to fulfil each line. Stock is updated accordingly.

```
npm run cli -- orders deliver <orderId> --product <medicationId>:<medicinalProductId> [--product ...]
```

**Options**

| Flag | Description |
|------|-------------|
| `--product <medicationId:medicinalProductId>` | Which product fulfils this line. Repeat once per line. |

**Example**

```
$ npm run cli -- orders deliver ord-abc123 --product med-paracetamol:prod-alvedon-500
Order ord-abc123 delivered.
```

Multi-line order:

```
$ npm run cli -- orders deliver ord-abc123 \
    --product med-paracetamol:prod-alvedon-500 \
    --product med-ibuprofen:prod-ibumetin-400
Order ord-abc123 delivered.
```

---

## Order lifecycle

```
create ──► Draft ──► Sent ──► Confirmed ──► Delivered
              advance   advance          deliver
```

Calling `advance` on a `Confirmed` order, or `deliver` on anything other than a `Confirmed` order, returns an error and exits with code 1.

---

## Error handling

On failure, commands print an error message to stderr and exit with code 1. The error text contains the rule code that was violated, for example:

```
Failed: OrderHasAtLeastOneLine
Failed: OrderNotFound
Failed: MissingProductSelection
Failed: ProductMedicationMismatch
```
