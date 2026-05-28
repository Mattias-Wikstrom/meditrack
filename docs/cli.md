# mt-cli

A command-line interface for managing medications and orders against the MediTrack PostgreSQL database.

## Prerequisites

- PostgreSQL running and reachable
- `.env` file at the project root with `DATABASE_URL` set (see `.env.example`)

## Running commands

All commands are run via the `mt-cli` npm script. Arguments after `--` are passed to the program:

```
npm run mt-cli -- <command> [options]
```

---

## Authentication

Commands that modify state require an active session. Read-only commands (`medications list/show`, `orders list`, `actors list`, `ward-units list`) do not.

### login

Verify your credentials and store a session token in `~/.meditrack/token`. The token is valid for 8 hours.

```
npm run mt-cli -- login --actor-id <id> --password <password>
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | Your actor ID (e.g. `nurse-anna`, `pharmacist-sofia`) |
| `--password <password>` | Your password |

**Example**

```
$ npm run mt-cli -- login --actor-id nurse-anna --password password
Logged in as nurse-anna.
```

Once logged in, subsequent commands read your identity from the stored token — no `--actor-id` flag is needed.

---

### passwd

Set the password for an actor. Prompts for the new password twice (input is not echoed). Does not require an active session — this is an administrative operation for operators with server access.

```
npm run mt-cli -- passwd --actor-id <id>
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | The actor whose password to set |

**Example**

```
$ npm run mt-cli -- passwd --actor-id nurse-anna
New password: 
Confirm password: 
Password updated.
```

---

## audit

### list

List audit log entries, optionally filtered by actor or order.

```
npm run mt-cli -- audit list [--actor-id <id>] [--order-id <id>]
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | Show only entries for this actor |
| `--order-id <id>` | Show only entries for this order |

**Examples**

```
$ npm run mt-cli -- audit list --order-id d5d7cc27-7ce7-4881-b569-72b414d5916b
2026-05-25T10:14:22.000Z  nurse-anna               OrderPlaced      d5d7cc27-7ce7-4881-b569-72b414d5916b

$ npm run mt-cli -- audit list --actor-id nurse-anna
2026-05-25T10:14:22.000Z  nurse-anna               OrderPlaced      d5d7cc27-7ce7-4881-b569-72b414d5916b
```

---

## actors

### list

List all actors and their roles.

```
npm run mt-cli -- actors list
```

**Example**

```
$ npm run mt-cli -- actors list
nurse-anna               Nurse
nurse-erik               Nurse
pharmacist-lars          Pharmacist
pharmacist-sofia         Pharmacist
```

---

### create

Create a new actor (admin only). Requires an initial password — the actor can log in immediately after creation.

```
npm run mt-cli -- actors create --actor-id <id> --role <role> [--ward-unit-id <id>] --password <password>
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | A unique identifier for the actor (e.g. `nurse-maja`) |
| `--role <role>` | `Nurse`, `Pharmacist`, or `Admin` |
| `--ward-unit-id <id>` | Ward unit the actor belongs to (required for `Nurse` role) |
| `--password <password>` | Initial password |

**Examples**

```
$ npm run mt-cli -- actors create --actor-id nurse-maja --role Nurse --ward-unit-id ward-akuten --password secret
Actor created: nurse-maja  role: Nurse  ward: ward-akuten

$ npm run mt-cli -- actors create --actor-id pharmacist-eva --role Pharmacist --password secret
Actor created: pharmacist-eva  role: Pharmacist
```

---

### bootstrap-create

Create the very first admin actor on a fresh database. Blocked if any admin already exists — use `actors create` instead once an admin is present. Does not require an active session.

```
npm run mt-cli -- actors bootstrap-create --actor-id <id> --role <role> [--ward-unit-id <id>] --password <password>
```

**Options**

| Flag | Description |
|------|-------------|
| `--actor-id <id>` | A unique identifier for the actor |
| `--role <role>` | `Nurse`, `Pharmacist`, or `Admin` |
| `--ward-unit-id <id>` | Ward unit the actor belongs to (required for `Nurse` role) |
| `--password <password>` | Initial password |

**Example**

```
$ npm run mt-cli -- actors bootstrap-create --actor-id admin --role Admin --password secret
Actor created: admin  role: Admin
```

---

### delete

Delete an actor (admin only).

```
npm run mt-cli -- actors delete <actorId>
```

**Example**

```
$ npm run mt-cli -- actors delete nurse-maja
Actor deleted: nurse-maja
```

---

## ward-units

### list

List all ward units.

```
npm run mt-cli -- ward-units list
```

**Example**

```
$ npm run mt-cli -- ward-units list
ward-akuten               Akuten
ward-medicin              Medicinavdelningen
ward-kirurgi              Kirurgavdelningen
```

---

### create

Create a new ward unit (admin only).

```
npm run mt-cli -- ward-units create --ward-unit-id <id> --name <name>
```

**Options**

| Flag | Description |
|------|-------------|
| `--ward-unit-id <id>` | A unique identifier for the ward unit (e.g. `ward-ortopedi`) |
| `--name <name>` | Display name (e.g. `Ortopedavdelningen`) |

**Example**

```
$ npm run mt-cli -- ward-units create --ward-unit-id ward-ortopedi --name Ortopedavdelningen
Ward unit created: ward-ortopedi  name: Ortopedavdelningen
```

---

### update

Update the display name of a ward unit (admin only).

```
npm run mt-cli -- ward-units update <wardUnitId> --name <name>
```

**Options**

| Flag | Description |
|------|-------------|
| `--name <name>` | New display name |

**Example**

```
$ npm run mt-cli -- ward-units update ward-ortopedi --name "Ortopedavdelningen 2"
Ward unit updated: ward-ortopedi
```

---

### delete

Delete a ward unit (admin only). Blocked if any nurses are still assigned to it.

```
npm run mt-cli -- ward-units delete <wardUnitId>
```

**Example**

```
$ npm run mt-cli -- ward-units delete ward-ortopedi
Ward unit deleted: ward-ortopedi
```

---

## medications

### list

List all medications. Optionally filter by INN name, ATC code, or form.

```
npm run mt-cli -- medications list [-q <query>]
```

**Options**

| Flag | Description |
|------|-------------|
| `-q, --query <query>` | Filter by INN name, ATC code, or form (case-insensitive) |

**Examples**

```
$ npm run mt-cli -- medications list
med-1  Paracetamol  N02BE01  Tablet  500mg
med-2  Ibuprofen    M01AE01  Tablet  400mg

$ npm run mt-cli -- medications list -q para
med-1  Paracetamol  N02BE01  Tablet  500mg
```

---

### show

Show full details for a single medication, including all registered medicinal products and their stock levels.

```
npm run mt-cli -- medications show <id>
```

**Examples**

```
$ npm run mt-cli -- medications show med-1
Paracetamol (N02BE01)
Form: Tablet   Strength: 500mg

Medicinal products:
  prod-1  Alvedon 500mg  stock: 42
  prod-2  Panodil 500mg  stock: 3  *** BELOW THRESHOLD ***
```

Stock is flagged with `*** BELOW THRESHOLD ***` when it is at or below the product's configured threshold.

---

### create

Create a new medication (pharmacist only).

```
npm run mt-cli -- medications create --inn-name <name> --atc-code <code> --form <form> --strength <strength>
```

**Options**

| Flag | Description |
|------|-------------|
| `--inn-name <name>` | INN (generic) name (e.g. `Paracetamol`) |
| `--atc-code <code>` | ATC code (e.g. `N02BE01`) |
| `--form <form>` | Dosage form (e.g. `Tablet`, `Capsule`, `Solution`) |
| `--strength <strength>` | Strength (e.g. `500 mg`) |

**Example**

```
$ npm run mt-cli -- medications create --inn-name Paracetamol --atc-code N02BE01 --form Tablet --strength "500 mg"
Medication created: med-abc123
```

---

### update

Update one or more fields of a medication (pharmacist only).

```
npm run mt-cli -- medications update <medicationId> [--inn-name <name>] [--atc-code <code>] [--form <form>] [--strength <strength>]
```

**Options**

| Flag | Description |
|------|-------------|
| `--inn-name <name>` | New INN name |
| `--atc-code <code>` | New ATC code |
| `--form <form>` | New dosage form |
| `--strength <strength>` | New strength |

**Example**

```
$ npm run mt-cli -- medications update med-1 --strength "1000 mg"
Medication updated: med-1
```

---

### delete

Delete a medication (pharmacist only). Blocked if any medicinal products exist for it — delete those first.

```
npm run mt-cli -- medications delete <medicationId>
```

**Example**

```
$ npm run mt-cli -- medications delete med-1
Medication deleted: med-1
```

---

## products

Medicinal products are the specific branded or generic items held in stock. Each product belongs to a medication.

### add

Add a medicinal product to a medication (pharmacist only).

```
npm run mt-cli -- products add <medicationId> --product-name <name> --stock-level <n> --stock-threshold <n>
```

**Options**

| Flag | Description |
|------|-------------|
| `--product-name <name>` | Product name (e.g. `Alvedon 500 mg`) |
| `--stock-level <n>` | Initial stock level |
| `--stock-threshold <n>` | Low-stock threshold — stock at or below this level is flagged |

**Example**

```
$ npm run mt-cli -- products add med-1 --product-name "Alvedon 500 mg" --stock-level 100 --stock-threshold 10
Product created: prod-abc123
```

---

### update

Update a medicinal product (pharmacist only).

```
npm run mt-cli -- products update <productId> [--product-name <name>] [--stock-threshold <n>]
```

**Options**

| Flag | Description |
|------|-------------|
| `--product-name <name>` | New product name |
| `--stock-threshold <n>` | New low-stock threshold |

**Example**

```
$ npm run mt-cli -- products update prod-1 --stock-threshold 20
Product updated: prod-1
```

---

### delete

Delete a medicinal product (pharmacist only).

```
npm run mt-cli -- products delete <productId>
```

**Example**

```
$ npm run mt-cli -- products delete prod-1
Product deleted: prod-1
```

---

### restock

Add units to a medicinal product's stock (pharmacist only).

```
npm run mt-cli -- products restock <productId> --quantity <n>
```

**Options**

| Flag | Description |
|------|-------------|
| `--quantity <n>` | Number of units to add |

**Example**

```
$ npm run mt-cli -- products restock prod-1 --quantity 50
Restocked prod-1: +50 units.
```

---

## orders

### list

List all orders across all ward units.

```
npm run mt-cli -- orders list
```

**Example**

```
$ npm run mt-cli -- orders list
ord-1  Draft      ward: ward-1  lines: 2
ord-2  Confirmed  ward: ward-2  lines: 1
```

---

### create

Create a new order in `Draft` status (nurse only). The ward unit is derived from your session — no flag needed.

```
npm run mt-cli -- orders create --medication-id <id> --quantity <n>
```

**Options**

| Flag | Description |
|------|-------------|
| `--medication-id <id>` | ID of the medication being ordered |
| `--quantity <n>` | Quantity to order (integer) |

**Example**

```
$ npm run mt-cli -- orders create --medication-id med-1 --quantity 50
Order created: ord-abc123  status: Draft
```

---

### send

Performed by a nurse. Submits a draft order to the pharmacy.

```
npm run mt-cli -- orders send <orderId>
```

**Example**

```
$ npm run mt-cli -- orders send ord-abc123
Order ord-abc123 is now: Sent
```

---

### confirm

Performed by a pharmacist. Confirms receipt of a sent order, making it ready for delivery.

```
npm run mt-cli -- orders confirm <orderId>
```

**Example**

```
$ npm run mt-cli -- orders confirm ord-abc123
Order ord-abc123 is now: Confirmed
```

---

### deliver

Mark a `Confirmed` order as delivered. Requires explicit product selections covering every order line — the pharmacist specifies which medicinal products were used and in what quantity. A single line can be fulfilled by multiple products. Stock is updated accordingly.

```
npm run mt-cli -- orders deliver <orderId> --product <medicationId>:<medicinalProductId>:<quantity> [--product ...]
```

**Options**

| Flag | Description |
|------|-------------|
| `--product <medicationId:medicinalProductId:quantity>` | A product used to fulfil this line. Repeat to split a line across multiple products. |

**Example**

```
$ npm run mt-cli -- orders deliver ord-abc123 --product med-paracetamol:prod-alvedon-500:50
Order ord-abc123 delivered.
```

Multi-line order, with one line split across two products:

```
$ npm run mt-cli -- orders deliver ord-abc123 \
    --product med-paracetamol:prod-alvedon-500:30 \
    --product med-paracetamol:prod-panodil-500:20 \
    --product med-ibuprofen:prod-ibumetin-400:10
Order ord-abc123 delivered.
```

---

## graphql

Execute a GraphQL query or mutation directly in-process against the database, without going through the HTTP server. Useful for ad-hoc queries and debugging. Requires an active session.

```
npm run mt-cli -- graphql <query> [--variables <json>]
```

**Options**

| Flag | Description |
|------|-------------|
| `--variables <json>` | Variables as a JSON object |

**Examples**

```
$ npm run mt-cli -- graphql '{ medications { id innName atcCode } }'

$ npm run mt-cli -- graphql '{ orders { id status } }'

$ npm run mt-cli -- graphql 'mutation($id: ID!) { sendOrder(id: $id) { id status } }' \
    --variables '{"id": "ord-abc123"}'
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
Not logged in. Run: npm run mt-cli -- login --actor-id <id> --password <password>
Session expired. Run: npm run mt-cli -- login --actor-id <id> --password <password>
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
