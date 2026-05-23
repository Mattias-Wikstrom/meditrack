import { DomainEvent } from '../../shared/DomainEvent';

export class StockBelowThreshold implements DomainEvent {
  readonly eventType = 'StockBelowThreshold';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly medicationId: string,
    public readonly medicationName: string, // TODO: Why this and not just medicationId?
    // TODO: What rule ensures medicationId and medicationName match?
    public readonly stockLevel: number,
    public readonly stockThreshold: number,
  ) {}
}
