# Low-stock email notifications (design proposal)

This document describes how to add **server-side email notifications** when stock drops below threshold, reusing the existing domain event flow (`StockBelowThreshold`).

## Current foundation (already in code)

- Domain event: `StockBelowThreshold`.
- Event publication: emitted by fulfillment flow when stock crosses below threshold.
- Event bus abstraction: `EventBus` with `publish`/`subscribe`.
- Running server uses `PubSubEventBus` to bridge to GraphQL subscriptions.

Because this already exists, email notifications can be added as a **new event subscriber** without changing GraphQL contracts.

---

## Proposed architecture

Add an application/infrastructure listener that subscribes to `StockBelowThreshold` and sends email via a provider adapter.

```text
DeliverOrderUseCase
  -> eventBus.publish(StockBelowThreshold)
     -> PubSubEventBus dispatch
        -> GraphQL subscription (existing)
        -> Email listener (new)
           -> Notification policy (who should receive)
           -> Email provider adapter (SendGrid/SES/etc)
```

### New components

1. **Notification listener**
   - `StockBelowThresholdEmailListener`
   - Implements `EventListener`
   - Receives domain event and orchestrates notification send.

2. **Recipient resolver / policy**
   - Resolves which actors should receive alerts.
   - Typical rule: pharmacists, optionally filtered by ward/unit.

3. **Email service abstraction**
   - `EmailSender` interface (provider-agnostic)
   - Implementations:
     - `SendGridEmailSender`
     - `SesEmailSender`
     - `NoopEmailSender` (dev/test)

4. **Idempotency + deduplication store**
   - Prevent repeated emails for the same “below threshold state”.
   - Suggested key: `medicinalProductId + thresholdCrossingWindow`.

---

## Event handling behavior

When `StockBelowThreshold` arrives:

1. Validate event payload (`medicinalProductId`, `productName`, `stockLevel`, `stockThreshold`, timestamp).
2. Check deduplication guard (avoid email storms on repeated events while still below threshold).
3. Resolve recipients using policy:
   - all pharmacists, or
   - pharmacists assigned to the relevant ward/unit if available in context.
4. Build template payload (subject/body).
5. Send email through configured `EmailSender`.
6. Log audit/telemetry:
   - event id/key,
   - recipients count,
   - provider response id,
   - success/failure.

---

## Recipient rules (suggested)

Start simple and evolve:

### v1 (minimal)
- Notify all actors with role `Pharmacist` and a configured email address.

### v2 (smarter routing)
- Notify only pharmacists responsible for the product’s ward/unit.
- Add escalation rule (e.g., if still below threshold after N hours, notify backup group).

### v3 (preferences)
- Per-actor opt-in/out.
- Quiet hours / digest mode.

---

## Data model additions (optional but recommended)

To support operational robustness:

- `actor.email` (if not already present)
- `notification_preferences` table (per actor)
- `notification_dispatch_log` table:
  - `id`
  - `event_type`
  - `dedupe_key`
  - `recipient`
  - `provider`
  - `status`
  - `error`
  - `created_at`

This enables retries, troubleshooting, and compliance reporting.

---

## Reliability considerations

### 1) Outbox pattern (recommended)
Current in-process publish is fine for MVP, but production-grade email delivery should use an outbox:

- Write domain changes + outbox record in the same DB transaction.
- Background worker reads outbox and sends notifications.
- Mark sent/failed with retry policy.

This avoids lost events on process crash.

### 2) Retry strategy
- Exponential backoff for transient provider failures.
- Dead-letter handling for permanent failures.

### 3) Rate limiting
- Protect against spikes if many products cross threshold simultaneously.

### 4) Idempotency
- Ensure repeated worker retries don’t send duplicate emails.

---

## Security and compliance

- Do not include unnecessary PHI in notification emails.
- Include minimal operational data (product name, stock level, threshold, link to app).
- Use verified sender domain + SPF/DKIM/DMARC.
- Store provider API keys in environment secrets.

---

## Suggested implementation steps

1. Add `EmailSender` interface and `NoopEmailSender`.
2. Add `StockBelowThresholdEmailListener` with dedupe guard.
3. Register listener in server startup/wiring.
4. Add provider adapter (SendGrid or SES).
5. Add recipient resolver (v1: all pharmacists).
6. Add structured logs and metrics.
7. Add tests:
   - unit tests for listener behavior,
   - integration test for event -> email dispatch (mock sender).
8. (Optional) Introduce outbox worker for robust delivery.

---

## Example pseudo-code

```ts
class StockBelowThresholdEmailListener implements EventListener {
  constructor(
    private readonly recipientPolicy: RecipientPolicy,
    private readonly emailSender: EmailSender,
    private readonly dedupe: NotificationDedupeStore,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'StockBelowThreshold') return;

    const e = event as StockBelowThreshold;
    const key = `low-stock:${e.medicinalProductId}:${e.stockThreshold}`;

    if (await this.dedupe.alreadySent(key)) return;

    const recipients = await this.recipientPolicy.resolveLowStockRecipients(e);
    if (recipients.length === 0) return;

    await this.emailSender.send({
      to: recipients,
      subject: `Low stock alert: ${e.productName}`,
      text: `${e.productName} is below threshold (${e.stockLevel}/${e.stockThreshold}).`,
    });

    await this.dedupe.markSent(key);
  }
}
```

---

## Relation to existing in-app notifications

- In-app alerts (GraphQL subscription) provide immediate UI feedback for active users.
- Email alerts cover offline/asynchronous awareness.
- Both can be driven by the same domain event (`StockBelowThreshold`) for consistent behavior.
