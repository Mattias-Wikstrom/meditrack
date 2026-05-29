# Security

## Authentication and sessions

The system uses JWT tokens signed with HS256. Tokens expire after 8 hours and are verified
on every request by the `requireAuth` middleware (REST) and the GraphQL context handler.

Known gaps:

- **Hardcoded fallback secret** — `src/domain/auth/jwt.ts` falls back to a hardcoded string
  if `JWT_SECRET` is not set in the environment. If the variable is missing in a production
  deployment, all tokens are signed with a publicly known secret. `JWT_SECRET` must always be
  set explicitly in production.
- **No token revocation** — tokens cannot be invalidated before they expire. A password change,
  a role change, or the need to lock out an actor does not take effect until the current token
  expires. Addressing this requires either shortening token lifetime or introducing a server-side
  denylist.
- **Role cached in the token** — the actor's role is embedded in the JWT and trusted without a
  database lookup. A role change in the database is not reflected until the actor's next login. [Note: It may be best for multiple reasons to completely remove the ability to change the role of a user. It is confusing and it is not needed.]
- **No brute-force protection** — the `POST /api/auth/login` endpoint has no rate limiting or
  account lockout. An attacker can try passwords without being slowed down.
- **No password policy** — only empty passwords are rejected. There is no minimum length or
  complexity requirement.

## Authorisation

Use cases enforce role-based access: each use case checks the actor's role and returns
`UnauthorizedRole` if it does not match. Roles are `Nurse`, `Pharmacist`, and `Admin`.

Known gaps:

- **No row-level authorisation on reads** — GraphQL queries do not restrict which orders or
  data an actor can read based on their ward unit. A nurse who knows an order ID from another
  ward can fetch it. Mutations are more strictly controlled by the use cases.
- **No superuser role** — there is no built-in way to perform privileged operations through
  the application. Exceptional operations require direct database access, which should be
  tightly controlled.

## Transport and API surface

- **HTTPS** — the server speaks plain HTTP. TLS must be terminated by a reverse proxy in front
  of the server. There is no application-level enforcement that this is in place.
- **CORS** — `cors()` is currently called without an `origin` restriction, allowing requests
  from any domain. In production this should be locked down to the known app origins.
- **GraphQL introspection** — enabled by default, which exposes the full schema to anyone who
  can reach the endpoint. This should be disabled in production.

## Audit log

Actions that mutate state are recorded in the `AuditLog` database table. Writes to business
data and the corresponding audit entry are committed in the same transaction, so the two cannot
fall out of sync due to partial failures.

Known gap:

- **Log integrity** — the audit log lives in the same database and is written by the same
  application. A sufficiently privileged database user could alter or delete records. For
  contexts where tamper-evident audit trails are a requirement, the log should be written to
  a separate, append-only store.

## User and role management

Authentication and role management are implemented as a custom system within MediTrack. Actors
are created via the CLI; passwords are set with the `passwd` command; roles are assigned at
creation time and can only be changed directly in the database.

This approach works for a standalone deployment but carries risk in a healthcare setting:

- **Manual lifecycle management** — when a staff member leaves, their MediTrack account must
  be disabled separately from any central hospital account. This is easy to overlook.
- **No single sign-on** — users maintain a separate set of credentials, which tends toward
  weaker passwords and more support overhead.
- **Compliance** — many healthcare organisations require that access to clinical systems is
  managed through their central identity infrastructure (Active Directory, LDAP, or a
  federation layer such as Keycloak or Azure AD). A custom system may not satisfy those
  requirements.

The long-term direction for a production deployment integrated into a hospital environment
would be to delegate authentication to the organisation's existing OIDC or SAML provider,
keeping only authorisation (role and ward unit assignment) inside MediTrack. This offloads
credential storage, MFA, session management, and account deprovisioning to a system that is
already audited and maintained.

## Secrets management

Two secrets are required at runtime: `DATABASE_URL` and `JWT_SECRET`. Both are read from the
`.env` file, which is git-ignored. The `.env.example` file documents the required variables
without values.

In a production environment these should be injected through a secrets manager or the platform's
environment variable mechanism rather than a file on disk.
