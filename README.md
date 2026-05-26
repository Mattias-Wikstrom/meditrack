# MediTrack

Medication tracking for modern healthcare workflows.

## Starting the system

Build the images and start all services:

```sh
docker compose build
docker compose up
```

This starts five containers: the PostgreSQL database, the Node.js API server, and the three
web apps. The API server automatically runs any pending database migrations on startup.

**First time only** — after the containers are up, seed the database with reference data
(actors, ward units, medications, and medicinal products):

```sh
docker compose run --rm api npm run seed
```

## Opening the apps

| App | URL |
|---|---|
| Nurse | http://localhost:5173 |
| Pharmacist | http://localhost:5174 |
| Admin | http://localhost:5175 |

## Logging in

All accounts seeded by `npm run seed` have the password `password`.

| Actor ID | Role | App |
|---|---|---|
| `nurse-anna` | Nurse | Nurse |
| `nurse-erik` | Nurse | Nurse |
| `pharmacist-sofia` | Pharmacist | Pharmacist |
| `pharmacist-lars` | Pharmacist | Pharmacist |
| `admin` | Admin | Admin |

## The apps

### Nurse

Nurses create and manage medication orders for their ward unit. A new order starts as a
draft — the nurse picks medications and sets quantities, then sends the order to the pharmacy
when it is ready. Sent orders can be viewed but not changed.

### Pharmacist

Pharmacists handle incoming orders from the wards. They confirm receipt of a sent order and
then deliver it by specifying exactly which medicinal products were used to fulfil each line.
Stock levels are updated on delivery. The pharmacist app also shows the current inventory,
including products that are running low.

### Admin

The admin app gives an overview of the whole system: all orders across all wards, the full
actor list, ward units, the audit log, and the medication inventory.
