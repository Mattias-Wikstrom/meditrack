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
docker compose run --rm api npx prisma db seed
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

## Other ways to test the code

The basic domain + business logic code that the whole system revolves around has been written so that it can be tested independently of a database or any other infrastructure. These tests can be run using 'npm test' or 'npx vitest run'.

It is also possible to test the business logic and the domain classes with a database connected but with little or no infrastructure apart from that. This allows you to set things up in the database as desired, execute some use case, and verify that the changes are what you expected. The way to do this is via 'npm run cli'. See the documentation in cli.md.

On the next higher level, you can start the NodeJS server that includes the business logic without using the web servers that serve the apps. This includes the possibility of running use cases via REST APIs as well as the possibility of querying the database using GraphQL queries. See the code in src/ui/server for details.

See the docs folder for more information on the architecture of the system and on how things can be set up.

## On the choice of technology stack

It would be perfectly possible to create desktop apps or mobile apps in addition to the current web apps. But since web apps can run everywhere, starting with web apps was a natural choice.

Using TypeScript is a simple way to get compilation-time types while running on a JavaScript platform. Using Node.JS on the backend allows you to use JavaScript/TypeScript everywhere. You do not need to switch back and forth between different syntaxes, different runtime models, etc.

Using React allows you to operate within the React ecosystem. If a modern web browser is a bit like an operating system on top of the operating system, React is another important layer on top of that. There are alternatives, but React is something of a standard and works really well.

The apps use a combination of GraphQL and REST APIs. GraphQL is used for retrieving information from the database in a flexible way. This eliminates the need to create lots and lots of REST APIs that do nothing more than ask the database for certain information that some client happens to be interested in. Clients can also retrieve information very quickly via Web Sockets and avoid the overhead of a traditional HTTPS call (which can slow down web UIs noticably; using modern versions of HTTP would be an alternative but that too requires configuration to work). On the other hand, REST APIs are used when the user has taken some action that needs to update the database (which is slow in any case). GraphQL is flexible way to express queries but loses its advantages when there is a non-trivial function that needs to be executed.

## On what has been implemented and what has not

Role-based authentication and auditing been viewed as priorities and therefore implemented. These are basic things and maybe something that is better thought about from the start.

An event system has also been implemented but sending out email notifications in response to events has not. The latter could be viewed as less fundamental. The focus has been on the basic architecture, not on extra features.

The business domain, business rules, and business logic have been prioritized. This is the core of the system and you want for it to be well-structured and supported with tests or other things that allow you to have confidence that things are working well.

The React-based UI has been implemented almost exclusively by AIs, but with clear instructions to keep the code DRY by putting things in reusable React components whenever reasonable. Making the UI responsive has been another priority. You should have the feeling that you are using an 'app,' not that you are using a web page. Making things simple, logical, and consistent has also been a priority.


