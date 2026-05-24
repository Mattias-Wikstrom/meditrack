import { DomainEvent } from '../domain/shared/eventContracts/DomainEvent';
import { EventListener } from '../domain/shared/eventContracts/EventListener';

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

  async handle(event: DomainEvent): Promise<void> {
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
