import { DomainEvent } from '../../shared/DomainEvent';

export class StockBelowThreshold implements DomainEvent {
  readonly eventType = 'StockBelowThreshold';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly medicationId: string,
    public readonly medicationName: string,
    public readonly stockLevel: number,
    public readonly stockThreshold: number,
  ) {}
}
