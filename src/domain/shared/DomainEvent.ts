export interface DomainEvent {
  readonly eventType: string;
  readonly actorId: string;
  readonly occurredAt: Date;
}
