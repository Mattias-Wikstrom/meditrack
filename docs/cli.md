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

## Authentication

Commands that modify state (`orders create`, `send`, `confirm`, `deliver`, and `graphql` mutations) require an active session. Read-only commands (`medications list/show`, `orders list`) do not.

### login

Verify your credentials and store a session token in `~/.meditrack/token`. The token is valid for 8 hours.

```
npm run cli -- login --actor-id <id> --password <password>
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | Your actor ID (e.g. `nurse-anna`, `pharmacist-sofia`) |
| `--password <password>` | Your password |

**Example**

```
$ npm run cli -- login --actor-id nurse-anna --password password
Logged in as nurse-anna.
```

Once logged in, subsequent commands read your identity from the stored token — no `--actor-id` flag is needed.

---

### passwd

Set the password for an actor. Prompts for the new password twice (input is not echoed). Does not require an active session — this is an administrative operation for operators with server access.

```
npm run cli -- passwd --actor-id <id>
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | The actor whose password to set |

**Example**

```
$ npm run cli -- passwd --actor-id nurse-anna
New password: 
Confirm password: 
Password updated.
```

---

## actors

### list

List all actors and their roles.

```
npm run cli -- actors list
```

**Example**

```
$ npm run cli -- actors list
nurse-anna               Nurse
nurse-erik               Nurse
pharmacist-lars          Pharmacist
pharmacist-sofia         Pharmacist
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

### send

Performed by a nurse. Submits a draft order to the pharmacy.

```
npm run cli -- orders send <orderId>
```

**Example**

```
$ npm run cli -- orders send ord-abc123
Order ord-abc123 is now: Sent
```

---

### confirm

Performed by a pharmacist. Confirms receipt of a sent order, making it ready for delivery.

```
npm run cli -- orders confirm <orderId>
```

**Example**

```
$ npm run cli -- orders confirm ord-abc123
Order ord-abc123 is now: Confirmed
```

---

### deliver

Mark a `Confirmed` order as delivered. Requires explicit product selections covering every order line — the pharmacist specifies which medicinal products were used and in what quantity. A single line can be fulfilled by multiple products. Stock is updated accordingly.

```
npm run cli -- orders deliver <orderId> --product <medicationId>:<medicinalProductId>:<quantity> [--product ...]
```

**Options**

| Flag | Description |
|------|-------------|
| `--product <medicationId:medicinalProductId:quantity>` | A product used to fulfil this line. Repeat to split a line across multiple products. |

**Example**

```
$ npm run cli -- orders deliver ord-abc123 --product med-paracetamol:prod-alvedon-500:50
Order ord-abc123 delivered.
```

Multi-line order, with one line split across two products:

```
$ npm run cli -- orders deliver ord-abc123 \
    --product med-paracetamol:prod-alvedon-500:30 \
    --product med-paracetamol:prod-panodil-500:20 \
    --product med-ibuprofen:prod-ibumetin-400:10
Order ord-abc123 delivered.
```

---

## Order lifecycle

```
create ──► Draft ──► Sent ──► Confirmed ──► Delivered
               send      confirm          deliver
```

`send` is performed by a nurse; `confirm` and `deliver` are performed by a pharmacist. Calling a command on an order in the wrong status returns an error and exits with code 1.

---

## Error handling

On failure, commands print an error message to stderr and exit with code 1.

Auth errors:

```
Not logged in. Run: meditrack login --actor-id <id> --password <password>
Session expired. Run: meditrack login --actor-id <id> --password <password>
Login failed: invalid actor ID or password.
```

Domain rule violations include the rule code, for example:

```
Failed: OrderHasAtLeastOneLine
Failed: OrderNotFound
Failed: SelectionQuantityMismatch
Failed: ProductMedicationMismatch
Failed: InsufficientStock
```
