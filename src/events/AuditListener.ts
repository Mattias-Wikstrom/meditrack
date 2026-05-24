import { DomainEvent } from '../../domain/shared/events/DomainEvent';
import { EventListener } from '../../domain/shared/events/EventListener';

export interface AuditLogEntry {
  readonly eventType: string;
  readonly actorId: string;
  readonly occurredAt: Date;
}

/**
 * Implements (in-memory) logging of domain events.
 */
export class AuditListener implements EventListener {
  private readonly entries: AuditLogEntry[] = [];

  handle(event: DomainEvent): void {
    this.entries.push({
      eventType: event.eventType,
      actorId: event.actorId,
      occurredAt: event.occurredAt,
    });
  }

  getEntries(): readonly AuditLogEntry[] {
    return this.entries;
  }
}
