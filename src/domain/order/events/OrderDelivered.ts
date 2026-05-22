import { DomainEvent } from '../../shared/DomainEvent';

export class OrderDelivered implements DomainEvent {
  readonly eventType = 'OrderDelivered';
  readonly occurredAt = new Date();

  constructor(
    public readonly actorId: string,
    public readonly orderId: string,
  ) {}
}
