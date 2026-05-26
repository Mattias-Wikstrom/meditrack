# Database Initialization

## First-time setup

### 1. Configure the database connection

Copy `.env.example` to `.env` and set `DATABASE_URL` to point at your PostgreSQL instance:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/meditrack?schema=public"
```

### 2. Run migrations

Apply the schema to the database:

```sh
npx prisma migrate deploy
```

This creates all tables. For local development you can use `npx prisma migrate dev` instead,
which also watches for schema changes and generates new migrations.

### 3. Seed reference data

```sh
npm run seed
```

This populates the database with development data: actors, ward units, medications, and medicinal
products (see [Seed data](#seed-data) below). All seeded actors get the password `password`.
Change passwords before using the system in any non-development context (see
[Setting passwords](#setting-passwords)).

---

## Seed data

### Actors

| ID | Role | Ward unit |
|---|---|---|
| `nurse-anna` | Nurse | `ward-akuten` |
| `nurse-erik` | Nurse | `ward-medicin` |
| `pharmacist-sofia` | Pharmacist | — |
| `pharmacist-lars` | Pharmacist | — |
| `admin` | Admin | — |

### Ward units

| ID | Name |
|---|---|
| `ward-akuten` | Akuten |
| `ward-medicin` | Medicinavdelningen |
| `ward-kirurgi` | Kirurgavdelningen |

### Medications and medicinal products

Seven medications are seeded (Paracetamol, Ibuprofen, Amoxicillin, Metformin, Furosemide,
Prednisolone, Salbutamol), each with one or two medicinal products. A few products are
intentionally seeded below their stock threshold so that the low-stock warning is visible
in a fresh environment.

---

## Setting passwords

The seed gives every actor the password `password`. To set a new password for an actor, use
the `passwd` CLI command. This is an administrative operation that does not require a login
session — it is intended to be run by an operator with direct server access.

```sh
npm run cli -- passwd --actor-id <id>
```

See the [CLI reference](cli.md#passwd) for details.

---

## Adding ward units

Use the `ward-units create` CLI command:

```sh
npm run cli -- ward-units create --ward-unit-id ward-ortopedi --name Ortopedavdelningen
```

See the [CLI reference](cli.md#create-1) for full details.

---

## Adding actors

Use the `actors create` CLI command:

```sh
npm run cli -- actors create --actor-id nurse-maja --role Nurse --ward-unit-id ward-akuten
npm run cli -- actors create --actor-id pharmacist-eva --role Pharmacist
```

Valid roles are `Nurse`, `Pharmacist`, and `Admin`. `--ward-unit-id` is required for nurses
and optional for pharmacists and admins.

After creating the actor, set their password with the `passwd` command described above.

See the [CLI reference](cli.md#create) for full details.

---

## Actor data model

```
Actor
  id           String       -- human-readable, e.g. "nurse-anna"
  role         ActorRole    -- Nurse | Pharmacist | Admin
  passwordHash String?      -- bcrypt hash; null until passwd is run
  wardUnitId   String?      -- foreign key to WardUnit; required for Nurse role
```
