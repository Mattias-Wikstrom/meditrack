
/**
 * Something that happened in the business domain that other parts of the system might care about, as opposed to technical events like UI events or Node.js EventEmitter events.
 */
export interface DomainEvent {
  readonly eventType: string;
  readonly actorId: string;
  readonly occurredAt: Date;
}
